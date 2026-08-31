/**
 * 🪷 EVENT CONTROLLER (Family Album Folders)
 * CRUD for events + memory linking/upload
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

export class EventController {
  // ─── List all events for the family ──────────────────────────────────────────
  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { type, search, page = '1', limit = '20' } = req.query;

      let query = `
        SELECT e.*,
          m_cover.uri AS cover_uri,
          m_cover.type AS cover_type,
          creator.first_name AS creator_first_name,
          creator.last_name AS creator_last_name
        FROM events e
        LEFT JOIN memories m_cover ON e.cover_memory_id = m_cover.id
        LEFT JOIN members creator ON e.created_by = creator.id
        WHERE e.family_id = ?
      `;
      const values: any[] = [req.user.familyId];

      if (type && type !== 'all') {
        query += ' AND e.event_type = ?';
        values.push(type);
      }

      if (search) {
        query += ' AND (e.name LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY e.event_date DESC, e.created_at DESC';

      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = Math.min(parseInt(limit as string, 10) || 20, 50);
      const offset = (pageNum - 1) * pageSize;
      query += ' LIMIT ? OFFSET ?';
      values.push(pageSize, offset);

      const [rows] = await pool.query(query, values);
      const events = (rows as any[]).map(this.formatEvent);

      // Get total count
      const [countRows] = await pool.query(
        'SELECT COUNT(*) as total FROM events WHERE family_id = ?',
        [req.user.familyId]
      );
      const total = (countRows as any[])[0]?.total || 0;

      res.json({
        success: true,
        data: events,
        meta: { page: pageNum, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Get single event ────────────────────────────────────────────────────────
  getEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;

      const [rows] = await pool.query(
        `SELECT e.*,
           m_cover.uri AS cover_uri,
           m_cover.type AS cover_type,
           creator.first_name AS creator_first_name,
           creator.last_name AS creator_last_name
         FROM events e
         LEFT JOIN memories m_cover ON e.cover_memory_id = m_cover.id
         LEFT JOIN members creator ON e.created_by = creator.id
         WHERE e.id = ? AND e.family_id = ?`,
        [eventId, req.user.familyId]
      );

      const event = (rows as any[])[0];
      if (!event) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      res.json({ success: true, data: this.formatEvent(event) });
    } catch (error) {
      next(error);
    }
  };

  // ─── Create event ────────────────────────────────────────────────────────────
  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const {
        name,
        description,
        eventType = 'other',
        eventDate,
        eventEndDate,
        location,
        coverMemoryId,
      } = req.body;

      if (!name || !name.trim()) {
        throw new AppError('Event name is required', 400, 'VALIDATION_ERROR');
      }

      const id = uuidv4();

      await pool.query(
        `INSERT INTO events (id, family_id, name, description, event_type,
           event_date, event_end_date, location, cover_memory_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          req.user.familyId,
          name.trim(),
          description || null,
          eventType,
          eventDate || null,
          eventEndDate || null,
          location || null,
          coverMemoryId || null,
          req.user.memberId,
        ]
      );

      // If memoryIds were provided, link them
      if (req.body.memoryIds && Array.isArray(req.body.memoryIds) && req.body.memoryIds.length > 0) {
        const insertValues = req.body.memoryIds.map((memId: string) => [id, memId]);
        await pool.query(
          'INSERT IGNORE INTO event_memories (event_id, memory_id) VALUES ?',
          [insertValues]
        );
        await this.updateMemoryCount(id);
      }

      res.status(201).json({
        success: true,
        data: { id, name: name.trim(), eventType, eventDate, location },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Update event ────────────────────────────────────────────────────────────
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;
      const { name, description, eventType, eventDate, eventEndDate, location, coverMemoryId } =
        req.body;

      // Verify ownership
      const [existing] = await pool.query(
        'SELECT id FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );
      if ((existing as any[]).length === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (eventType !== undefined) { updates.push('event_type = ?'); values.push(eventType); }
      if (eventDate !== undefined) { updates.push('event_date = ?'); values.push(eventDate); }
      if (eventEndDate !== undefined) { updates.push('event_end_date = ?'); values.push(eventEndDate); }
      if (location !== undefined) { updates.push('location = ?'); values.push(location); }
      if (coverMemoryId !== undefined) { updates.push('cover_memory_id = ?'); values.push(coverMemoryId); }

      if (updates.length === 0) {
        throw new AppError('No fields to update', 400, 'VALIDATION_ERROR');
      }

      values.push(eventId, req.user.familyId);
      await pool.query(
        `UPDATE events SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`,
        values
      );

      res.json({ success: true, data: { id: eventId, message: 'Event updated' } });
    } catch (error) {
      next(error);
    }
  };

  // ─── Delete event ────────────────────────────────────────────────────────────
  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;

      const [result] = await pool.query(
        'DELETE FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );

      if ((result as any).affectedRows === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      res.json({ success: true, data: { message: 'Event deleted' } });
    } catch (error) {
      next(error);
    }
  };

  // ─── Get memories in an event ────────────────────────────────────────────────
  getEventMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;
      const { type, page = '1', limit = '30' } = req.query;

      // Verify event belongs to family
      const [eventRows] = await pool.query(
        'SELECT id FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );
      if ((eventRows as any[]).length === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      let query = `
        SELECT m.*,
          GROUP_CONCAT(DISTINCT mm.member_id) AS tagged_member_ids
        FROM event_memories em
        JOIN memories m ON em.memory_id = m.id
        LEFT JOIN memory_members mm ON m.id = mm.memory_id
        WHERE em.event_id = ?
      `;
      const values: any[] = [eventId];

      if (type && type !== 'all') {
        query += ' AND m.type = ?';
        values.push(type);
      }

      query += ' GROUP BY m.id ORDER BY m.captured_at ASC, m.created_at ASC';

      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = Math.min(parseInt(limit as string, 10) || 30, 100);
      const offset = (pageNum - 1) * pageSize;
      query += ' LIMIT ? OFFSET ?';
      values.push(pageSize, offset);

      const [rows] = await pool.query(query, values);
      const memories = (rows as any[]).map(this.formatMemory);

      // Count
      const [countRows] = await pool.query(
        'SELECT COUNT(*) as total FROM event_memories WHERE event_id = ?',
        [eventId]
      );
      const total = (countRows as any[])[0]?.total || 0;

      res.json({
        success: true,
        data: memories,
        meta: { page: pageNum, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Add existing memories to event ──────────────────────────────────────────
  addMemoriesToEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;
      const { memoryIds } = req.body;

      if (!Array.isArray(memoryIds) || memoryIds.length === 0) {
        throw new AppError('memoryIds array is required', 400, 'VALIDATION_ERROR');
      }

      // Verify event belongs to family
      const [eventRows] = await pool.query(
        'SELECT id FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );
      if ((eventRows as any[]).length === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      // Verify all memories belong to the family
      const [memRows] = await pool.query(
        'SELECT id FROM memories WHERE id IN (?) AND family_id = ?',
        [memoryIds, req.user.familyId]
      );
      const validIds = (memRows as any[]).map((r: any) => r.id);

      if (validIds.length === 0) {
        throw new AppError('No valid memories found', 400, 'VALIDATION_ERROR');
      }

      const insertValues = validIds.map((memId: string) => [eventId, memId]);
      await pool.query(
        'INSERT IGNORE INTO event_memories (event_id, memory_id) VALUES ?',
        [insertValues]
      );

      await this.updateMemoryCount(eventId);

      res.json({
        success: true,
        data: { added: validIds.length, eventId },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Upload new memories directly into event ────────────────────────────────
  uploadToEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400, 'VALIDATION_ERROR');
      }

      // Verify event belongs to family
      const [eventRows] = await pool.query(
        'SELECT id, name FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );
      if ((eventRows as any[]).length === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      const eventName = (eventRows as any[])[0].name;
      const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const uploadedMemories: any[] = [];

      for (const file of files) {
        const memoryId = uuidv4();
        const isVideo = file.mimetype.startsWith('video/');
        const memoryType = isVideo ? 'video' : 'photo';
        const uri = `/uploads/${isVideo ? 'memories' : 'memories'}/${file.filename}`;

        await pool.query(
          `INSERT INTO memories (id, family_id, type, uri, title, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            memoryId,
            req.user.familyId,
            memoryType,
            uri,
            req.body.title || `${eventName} - ${memoryType}`,
            req.user.memberId,
          ]
        );

        // Link to event
        await pool.query(
          'INSERT INTO event_memories (event_id, memory_id) VALUES (?, ?)',
          [eventId, memoryId]
        );

        // Track storage
        await pool.query(
          'UPDATE families SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?',
          [file.size, req.user.familyId]
        );

        uploadedMemories.push({
          id: memoryId,
          type: memoryType,
          uri: `${BASE_URL}${uri}`,
          title: req.body.title || `${eventName} - ${memoryType}`,
          fileSize: file.size,
        });
      }

      await this.updateMemoryCount(eventId);

      res.status(201).json({
        success: true,
        data: {
          uploaded: uploadedMemories.length,
          memories: uploadedMemories,
          eventId,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Remove memory from event ────────────────────────────────────────────────
  removeMemoryFromEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { eventId, memoryId } = req.params;

      // Verify event belongs to family
      const [eventRows] = await pool.query(
        'SELECT id FROM events WHERE id = ? AND family_id = ?',
        [eventId, req.user.familyId]
      );
      if ((eventRows as any[]).length === 0) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      await pool.query(
        'DELETE FROM event_memories WHERE event_id = ? AND memory_id = ?',
        [eventId, memoryId]
      );

      await this.updateMemoryCount(eventId);

      res.json({ success: true, data: { message: 'Memory removed from event' } });
    } catch (error) {
      next(error);
    }
  };

  // ─── Helper: Update memory_count and video_count on events ───────────────────
  private updateMemoryCount = async (eventId: string) => {
    await pool.query(
      `UPDATE events SET
         memory_count = (SELECT COUNT(*) FROM event_memories WHERE event_id = ?),
         video_count = (
           SELECT COUNT(*) FROM event_memories em
           JOIN memories m ON em.memory_id = m.id
           WHERE em.event_id = ? AND m.type = 'video'
         )
       WHERE id = ?`,
      [eventId, eventId, eventId]
    );
  };

  // ─── Helper: Format event row ─────────────────────────────────────────────────
  private formatEvent = (row: any) => {
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return {
      id: row.id,
      familyId: row.family_id,
      name: row.name,
      description: row.description,
      eventType: row.event_type,
      eventDate: row.event_date,
      eventEndDate: row.event_end_date,
      location: row.location,
      coverMemoryId: row.cover_memory_id,
      coverUri: row.cover_uri ? `${BASE_URL}${row.cover_uri}` : null,
      coverType: row.cover_type || null,
      createdBy: row.created_by,
      creatorName: row.creator_first_name
        ? `${row.creator_first_name} ${row.creator_last_name || ''}`.trim()
        : null,
      memoryCount: row.memory_count || 0,
      videoCount: row.video_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  };

  // ─── Helper: Format memory row ────────────────────────────────────────────────
  private formatMemory = (row: any) => {
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return {
      id: row.id,
      type: row.type,
      uri: `${BASE_URL}${row.uri}`,
      title: row.title,
      description: row.description,
      capturedAt: row.captured_at,
      uploadedBy: row.uploaded_by,
      placeName: row.place_name,
      eraName: row.era_name,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      isFavorite: !!row.is_favorite,
      linkedMembers: row.tagged_member_ids
        ? row.tagged_member_ids.split(',')
        : [],
      createdAt: row.created_at,
    };
  };
}
