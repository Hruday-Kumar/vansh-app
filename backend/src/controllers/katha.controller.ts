/**
 * 🪷 KATHA CONTROLLER
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';
import { GeminiService } from '../services/gemini.service';

export class KathaController {
  private gemini = new GeminiService();
  
  /**
   * Get kathas with filters
   */
  getKathas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { type, narratorId, search, favorite, page = '1', limit = '20' } = req.query;
      
      let query = `
        SELECT k.*, m.first_name as narrator_first, m.last_name as narrator_last, m.avatar_uri as narrator_avatar
        FROM kathas k
        LEFT JOIN members m ON k.narrator_id = m.id
        WHERE k.family_id = ?
      `;
      const values: any[] = [req.user.familyId];
      
      if (type) {
        query += ' AND k.type = ?';
        values.push(type);
      }
      
      if (narratorId) {
        query += ' AND k.narrator_id = ?';
        values.push(narratorId);
      }
      
      if (search) {
        query += ' AND (k.title LIKE ? OR k.transcript LIKE ?)';
        values.push(`%${search}%`, `%${search}%`);
      }
      
      if (favorite === 'true') {
        query += ' AND k.is_favorite = true';
      }
      
      query += ' ORDER BY k.created_at DESC';
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      query += ` LIMIT ${limitNum} OFFSET ${(pageNum - 1) * limitNum}`;
      
      const [kathas] = await pool.query(query, values) as any[];
      
      res.json({
        success: true,
        data: kathas.map(this.formatKatha)
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get single katha
   */
  getKatha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      
      const [kathas] = await pool.query(`
        SELECT k.*, m.first_name as narrator_first, m.last_name as narrator_last, m.avatar_uri as narrator_avatar
        FROM kathas k
        LEFT JOIN members m ON k.narrator_id = m.id
        WHERE k.id = ? AND k.family_id = ?
      `, [kathaId, req.user.familyId]) as any[];
      
      if (kathas.length === 0) {
        throw new AppError('Katha not found', 404, 'KATHA_NOT_FOUND');
      }
      
      const kathaData = this.formatKatha(kathas[0]);
      // Note: katha_members table doesn't exist in current schema
      // Returning empty mentionedMembers for now
      const katha = {
        ...kathaData,
        mentionedMembers: []
      };
      
      res.json({ success: true, data: katha });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create katha (upload audio)
   */
  createKatha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      if (!req.file) {
        throw new AppError('No audio file uploaded', 400, 'NO_FILE');
      }
      
      const {
        type = 'standalone_story', narratorId, title, description,
        language = 'en', tags, duration
      } = req.body;
      
      const kathaId = uuidv4();
      const audioUri = `/uploads/kathas/${req.file.filename}`;
      
      // Use duration from request or default to 60
      const durationSeconds = parseInt(duration) || 60;
      
      await pool.query(`
        INSERT INTO kathas (
          id, family_id, type, audio_uri, duration_seconds,
          narrator_id, title, description, language, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        kathaId, req.user.familyId, type, audioUri, durationSeconds,
        narratorId || req.user.memberId,
        title || 'Untitled Story', description || null, language,
        tags ? JSON.stringify(JSON.parse(tags)) : null
      ]);
      
      res.status(201).json({
        success: true,
        data: { id: kathaId, audioUri, durationSeconds }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update katha
   */
  updateKatha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      const { title, description, tags, syncPoints } = req.body;
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
      if (syncPoints !== undefined) { updates.push('sync_points = ?'); values.push(JSON.stringify(syncPoints)); }
      
      if (updates.length === 0) {
        throw new AppError('No fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(kathaId, req.user.familyId);
      await pool.query(
        `UPDATE kathas SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`,
        values
      );
      
      res.json({ success: true, message: 'Katha updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete katha
   */
  deleteKatha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      
      await pool.query(
        'DELETE FROM kathas WHERE id = ? AND family_id = ?',
        [kathaId, req.user.familyId]
      );
      
      res.json({ success: true, message: 'Katha deleted' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Transcribe katha using Gemini
   */
  transcribeKatha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      
      const [kathas] = await pool.query(
        'SELECT audio_uri, language FROM kathas WHERE id = ? AND family_id = ?',
        [kathaId, req.user.familyId]
      ) as any[];
      
      if (kathas.length === 0) {
        throw new AppError('Katha not found', 404, 'KATHA_NOT_FOUND');
      }
      
      // Use Gemini to transcribe
      const transcription = await this.gemini.transcribeAudio(
        kathas[0].audio_uri,
        kathas[0].language
      );
      
      // Update katha with transcription
      await pool.query(`
        UPDATE kathas SET 
          transcript = ?,
          transcript_segments = ?,
          summary = ?,
          topics = ?
        WHERE id = ?
      `, [
        transcription.text,
        JSON.stringify(transcription.segments),
        transcription.summary,
        JSON.stringify(transcription.topics),
        kathaId
      ]);
      
      res.json({
        success: true,
        data: {
          transcript: transcription.text,
          segments: transcription.segments,
          summary: transcription.summary,
          topics: transcription.topics
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Link katha to memory
   */
  linkToMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      const { memoryId, syncPoints } = req.body;
      
      if (!memoryId) {
        throw new AppError('Memory ID required', 400, 'MISSING_MEMORY_ID');
      }
      
      await pool.query(`
        UPDATE kathas SET 
          linked_memory_id = ?,
          sync_points = ?,
          type = 'voice_overlay'
        WHERE id = ? AND family_id = ?
      `, [
        memoryId,
        syncPoints ? JSON.stringify(syncPoints) : null,
        kathaId, req.user.familyId
      ]);
      
      res.json({ success: true, message: 'Katha linked to memory' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Unlink katha from memory
   */
  unlinkFromMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      
      await pool.query(`
        UPDATE kathas SET 
          linked_memory_id = NULL,
          sync_points = NULL,
          type = 'standalone_story'
        WHERE id = ? AND family_id = ?
      `, [kathaId, req.user.familyId]);
      
      res.json({ success: true, message: 'Katha unlinked from memory' });
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
      
      const { kathaId } = req.params;
      
      await pool.query(
        'UPDATE kathas SET is_favorite = NOT is_favorite WHERE id = ? AND family_id = ?',
        [kathaId, req.user.familyId]
      );
      
      const [[result]] = await pool.query(
        'SELECT is_favorite FROM kathas WHERE id = ?',
        [kathaId]
      ) as any[];
      
      res.json({ success: true, data: { isFavorite: result?.is_favorite } });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Record play
   */
  recordPlay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { kathaId } = req.params;
      
      await pool.query(
        'UPDATE kathas SET play_count = play_count + 1 WHERE id = ? AND family_id = ?',
        [kathaId, req.user.familyId]
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
  
  // Helper to format katha data
  private formatKatha = (k: any) => ({
    id: k.id,
    type: k.type,
    audioUri: k.audio_uri,
    duration: k.duration_seconds,
    durationSeconds: k.duration_seconds,
    narrator: k.narrator_first ? {
      id: k.narrator_id,
      name: `${k.narrator_first} ${k.narrator_last}`,
      avatarUri: k.narrator_avatar
    } : null,
    narratorId: k.narrator_id,
    title: k.title,
    description: k.description,
    transcript: k.transcript,
    aiSummary: k.ai_summary,
    language: k.language,
    topics: k.topics ? JSON.parse(k.topics) : [],
    tags: k.tags ? JSON.parse(k.tags) : [],
    isFeatured: k.is_featured,
    playCount: k.play_count,
    privacyLevel: k.privacy_level,
    createdAt: k.created_at,
    updatedAt: k.updated_at
  });
}
