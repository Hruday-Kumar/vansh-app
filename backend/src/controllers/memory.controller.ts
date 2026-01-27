/**
 * 🪷 MEMORY CONTROLLER (Smriti)
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';
import { GeminiService } from '../services/gemini.service';

export class MemoryController {
  private gemini = new GeminiService();
  
  /**
   * Get memories with filters
   */
  getMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { type, search, memberIds, tags, fromDate, toDate, era, favorite, page = '1', limit = '20' } = req.query;
      
      let query = `
        SELECT m.*, 
          GROUP_CONCAT(DISTINCT mm.member_id) as tagged_member_ids
        FROM memories m
        LEFT JOIN memory_members mm ON m.id = mm.memory_id
        WHERE m.family_id = ?
      `;
      const values: any[] = [req.user.familyId];
      
      if (type) {
        query += ' AND m.type = ?';
        values.push(type);
      }
      
      if (search) {
        query += ' AND (m.title LIKE ? OR m.description LIKE ? OR m.ocr_text LIKE ?)';
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (memberIds) {
        const ids = (memberIds as string).split(',');
        query += ` AND m.id IN (SELECT memory_id FROM memory_members WHERE member_id IN (${ids.map(() => '?').join(',')}))`;
        values.push(...ids);
      }
      
      if (tags) {
        const tagList = (tags as string).split(',');
        tagList.forEach(tag => {
          query += ' AND JSON_CONTAINS(m.tags, ?)';
          values.push(JSON.stringify(tag));
        });
      }
      
      if (fromDate) {
        query += ' AND m.captured_at >= ?';
        values.push(fromDate);
      }
      
      if (toDate) {
        query += ' AND m.captured_at <= ?';
        values.push(toDate);
      }
      
      if (era) {
        query += ' AND m.era_year = ?';
        values.push(era);
      }
      
      if (favorite === 'true') {
        query += ' AND m.is_favorite = true';
      }
      
      query += ' GROUP BY m.id ORDER BY m.captured_at DESC, m.created_at DESC';
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      query += ` LIMIT ${limitNum} OFFSET ${(pageNum - 1) * limitNum}`;
      
      const [memories] = await pool.query(query, values) as any[];
      
      // Get total count
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM memories WHERE family_id = ?',
        [req.user.familyId]
      ) as any[];
      
      res.json({
        success: true,
        data: memories.map(this.formatMemory),
        meta: {
          page: pageNum,
          pageSize: limitNum,
          total,
          hasMore: pageNum * limitNum < total
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get single memory
   */
  getMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      
      const [memories] = await pool.query(
        'SELECT * FROM memories WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      ) as any[];
      
      if (memories.length === 0) {
        throw new AppError('Memory not found', 404, 'MEMORY_NOT_FOUND');
      }
      
      // Get tagged members
      const [taggedMembers] = await pool.query(`
        SELECT mm.*, m.first_name, m.last_name, m.avatar_uri
        FROM memory_members mm
        JOIN members m ON mm.member_id = m.id
        WHERE mm.memory_id = ?
      `, [memoryId]) as any[];
      
      // Get linked kathas
      const [kathas] = await pool.query(
        'SELECT id, title, duration_seconds FROM kathas WHERE linked_memory_id = ?',
        [memoryId]
      ) as any[];
      
      // Increment view count
      await pool.query(
        'UPDATE memories SET view_count = view_count + 1 WHERE id = ?',
        [memoryId]
      );
      
      const memoryData = this.formatMemory(memories[0]);
      const memory = {
        ...memoryData,
        taggedMembers: taggedMembers.map((tm: any) => ({
          memberId: tm.member_id,
          name: `${tm.first_name} ${tm.last_name}`,
          avatarUri: tm.avatar_uri,
          isAiSuggested: tm.is_ai_suggested,
          isConfirmed: tm.is_confirmed,
          faceRegion: tm.face_region ? JSON.parse(tm.face_region) : null
        })),
        linkedKathas: kathas
      };
      
      res.json({ success: true, data: memory });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Upload memory
   */
  uploadMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
      }
      
      const { title, description, capturedAt, placeName, taggedMembers, tags, eraName, eraYear } = req.body;
      
      // Determine type from mimetype
      let type = 'document';
      if (req.file.mimetype.startsWith('image/')) type = 'photo';
      else if (req.file.mimetype.startsWith('video/')) type = 'video';
      else if (req.file.mimetype.startsWith('audio/')) type = 'audio';
      
      const memoryId = uuidv4();
      const uri = `/uploads/memories/${req.file.filename}`;
      
      await pool.query(`
        INSERT INTO memories (
          id, family_id, type, uri, uploaded_by,
          title, description, captured_at, place_name, tags,
          era_name, era_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        memoryId, req.user.familyId, type, uri, req.user.memberId,
        title || null, description || null,
        capturedAt || null, placeName || null,
        tags ? JSON.stringify(JSON.parse(tags)) : null,
        eraName || null, eraYear || null
      ]);
      
      // Tag members
      if (taggedMembers) {
        const memberIds = JSON.parse(taggedMembers);
        for (const memberId of memberIds) {
          await pool.query(`
            INSERT INTO memory_members (id, memory_id, member_id)
            VALUES (?, ?, ?)
          `, [uuidv4(), memoryId, memberId]);
        }
      }
      
      // Update family storage
      await pool.query(
        'UPDATE families SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?',
        [req.file.size, req.user.familyId]
      );
      
      // Build full URL for the uploaded file
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const fullUri = `${baseUrl}${uri}`;
      
      res.status(201).json({
        success: true,
        data: { id: memoryId, uri: fullUri, type }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Upload multiple memories
   */
  uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400, 'NO_FILES');
      }
      
      const results: Array<{ id: string; uri: string; type: string }> = [];
      
      for (const file of req.files) {
        let type = 'document';
        if (file.mimetype.startsWith('image/')) type = 'photo';
        else if (file.mimetype.startsWith('video/')) type = 'video';
        else if (file.mimetype.startsWith('audio/')) type = 'audio';
        
        const memoryId = uuidv4();
        const uri = `/uploads/memories/${file.filename}`;
        const title = file.originalname.replace(/\.[^/.]+$/, '') || 'Untitled Memory';
        
        await pool.query(`
          INSERT INTO memories (id, family_id, type, uri, title, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [memoryId, req.user.familyId, type, uri, title, req.user.memberId]);
        
        // Build full URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const fullUri = `${baseUrl}${uri}`;
        
        results.push({ id: memoryId, uri: fullUri, type });
      }
      
      res.status(201).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update memory
   */
  updateMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      const { title, description, capturedAt, placeName, tags, eraName, eraYear } = req.body;
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (capturedAt !== undefined) { updates.push('captured_at = ?'); values.push(capturedAt); }
      if (placeName !== undefined) { updates.push('place_name = ?'); values.push(placeName); }
      if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
      if (eraName !== undefined) { updates.push('era_name = ?'); values.push(eraName); }
      if (eraYear !== undefined) { updates.push('era_year = ?'); values.push(eraYear); }
      
      if (updates.length === 0) {
        throw new AppError('No fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(memoryId, req.user.familyId);
      await pool.query(
        `UPDATE memories SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`,
        values
      );
      
      res.json({ success: true, message: 'Memory updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete memory
   */
  deleteMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      
      // Get file size for storage update
      const [memories] = await pool.query(
        'SELECT file_size FROM memories WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      ) as any[];
      
      if (memories.length > 0) {
        await pool.query(
          'DELETE FROM memories WHERE id = ? AND family_id = ?',
          [memoryId, req.user.familyId]
        );
        
        // Update storage
        await pool.query(
          'UPDATE families SET storage_used_bytes = GREATEST(0, storage_used_bytes - ?) WHERE id = ?',
          [memories[0].file_size || 0, req.user.familyId]
        );
      }
      
      res.json({ success: true, message: 'Memory deleted' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Add tags
   */
  addTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      const { tags } = req.body;
      
      if (!tags || !Array.isArray(tags)) {
        throw new AppError('Tags array required', 400, 'INVALID_TAGS');
      }
      
      // Get existing tags and merge
      const [memories] = await pool.query(
        'SELECT tags FROM memories WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      ) as any[];
      
      if (memories.length === 0) {
        throw new AppError('Memory not found', 404, 'MEMORY_NOT_FOUND');
      }
      
      const existingTags = memories[0].tags ? JSON.parse(memories[0].tags) : [];
      const newTags = [...new Set([...existingTags, ...tags])];
      
      await pool.query(
        'UPDATE memories SET tags = ? WHERE id = ?',
        [JSON.stringify(newTags), memoryId]
      );
      
      res.json({ success: true, data: { tags: newTags } });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Remove tag
   */
  removeTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId, tag } = req.params;
      
      const [memories] = await pool.query(
        'SELECT tags FROM memories WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      ) as any[];
      
      if (memories.length > 0 && memories[0].tags) {
        const tags = JSON.parse(memories[0].tags).filter((t: string) => t !== tag);
        await pool.query(
          'UPDATE memories SET tags = ? WHERE id = ?',
          [JSON.stringify(tags), memoryId]
        );
      }
      
      res.json({ success: true, message: 'Tag removed' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Tag members in memory
   */
  tagMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      const { memberIds, faceRegions } = req.body;
      
      if (!memberIds || !Array.isArray(memberIds)) {
        throw new AppError('Member IDs array required', 400, 'INVALID_MEMBERS');
      }
      
      for (let i = 0; i < memberIds.length; i++) {
        const memberId = uuidv4();
        await pool.query(`
          INSERT INTO memory_members (id, memory_id, member_id, x_position, y_position)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE x_position = VALUES(x_position), y_position = VALUES(y_position)
        `, [
          memberId, memoryId, memberIds[i],
          faceRegions?.[i]?.x || null,
          faceRegions?.[i]?.y || null
        ]);
      }
      
      res.json({ success: true, message: 'Members tagged' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Untag member
   */
  untagMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId, memberId } = req.params;
      
      await pool.query(
        'DELETE FROM memory_members WHERE memory_id = ? AND member_id = ?',
        [memoryId, memberId]
      );
      
      res.json({ success: true, message: 'Member untagged' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Toggle favorite
   */
  toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      
      await pool.query(
        'UPDATE memories SET is_favorite = NOT is_favorite WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      );
      
      const [[result]] = await pool.query(
        'SELECT is_favorite FROM memories WHERE id = ?',
        [memoryId]
      ) as any[];
      
      res.json({ success: true, data: { isFavorite: result?.is_favorite } });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get Time River (chronological timeline)
   */
  getTimeRiver = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const [memories] = await pool.query(`
        SELECT id, type, uri, thumbnail_uri, title, captured_at, era_name, era_year
        FROM memories
        WHERE family_id = ? AND captured_at IS NOT NULL
        ORDER BY captured_at ASC
      `, [req.user.familyId]) as any[];
      
      // Group by era/year
      const eras: Record<number, any[]> = {};
      memories.forEach((m: any) => {
        const year = m.era_year || new Date(m.captured_at).getFullYear();
        if (!eras[year]) eras[year] = [];
        eras[year].push({
          id: m.id,
          type: m.type,
          uri: m.uri,
          thumbnailUri: m.thumbnail_uri,
          title: m.title,
          capturedAt: m.captured_at
        });
      });
      
      const timeline = Object.entries(eras)
        .map(([year, items]) => ({ year: parseInt(year), items }))
        .sort((a, b) => a.year - b.year);
      
      res.json({ success: true, data: timeline });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Analyze memory with AI
   */
  analyzeMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { memoryId } = req.params;
      
      const [memories] = await pool.query(
        'SELECT * FROM memories WHERE id = ? AND family_id = ?',
        [memoryId, req.user.familyId]
      ) as any[];
      
      if (memories.length === 0) {
        throw new AppError('Memory not found', 404, 'MEMORY_NOT_FOUND');
      }
      
      const memory = memories[0];
      
      // Use Gemini to analyze (for images)
      if (memory.type === 'photo') {
        const analysis = await this.gemini.analyzeImage(memory.uri);
        
        await pool.query(`
          UPDATE memories SET 
            ai_description = ?,
            detected_objects = ?
          WHERE id = ?
        `, [analysis.description, JSON.stringify(analysis.objects), memoryId]);
        
        res.json({
          success: true,
          data: {
            description: analysis.description,
            objects: analysis.objects,
            suggestedTags: analysis.suggestedTags
          }
        });
      } else {
        res.json({ success: true, data: { message: 'AI analysis not available for this type' } });
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Helper to format memory data
  private formatMemory = (m: any) => {
    // Build full URL for media files
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fullUri = m.uri?.startsWith('http') ? m.uri : `${baseUrl}${m.uri}`;
    const fullThumbnailUri = m.thumbnail_uri?.startsWith('http') ? m.thumbnail_uri : (m.thumbnail_uri ? `${baseUrl}${m.thumbnail_uri}` : null);
    
    return {
      id: m.id,
      type: m.type,
      uri: fullUri,
      thumbnailUri: fullThumbnailUri,
      blurhash: m.blurhash,
      title: m.title,
      description: m.description,
      capturedAt: m.captured_at,
      uploadedAt: m.uploaded_at,
      uploadedBy: m.uploaded_by,
      placeName: m.place_name,
      location: m.location_lat ? { lat: m.location_lat, lng: m.location_lng } : null,
      detectedFaces: m.detected_faces ? JSON.parse(m.detected_faces) : null,
      detectedObjects: m.detected_objects ? JSON.parse(m.detected_objects) : null,
      ocrText: m.ocr_text,
      aiDescription: m.ai_description,
      tags: m.tags ? JSON.parse(m.tags) : [],
      eraName: m.era_name,
      eraYear: m.era_year,
      isFavorite: m.is_favorite,
      viewCount: m.view_count,
      taggedMemberIds: m.tagged_member_ids ? m.tagged_member_ids.split(',') : []
    };
  };
}
