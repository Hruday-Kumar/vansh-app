/**
 * 🪷 VASIYAT CONTROLLER
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

export class VasiyatController {
  /**
   * Get vasiyats (for creator or recipient)
   */
  getVasiyats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { created, received, unlocked } = req.query;
      
      let query: string;
      const values: any[] = [];
      
      if (received === 'true') {
        // Get vasiyats where user is a recipient
        query = `
          SELECT v.*, vr.has_viewed, vr.relationship_label,
            m.first_name as creator_first, m.last_name as creator_last, m.avatar_uri as creator_avatar
          FROM vasiyats v
          JOIN vasiyat_recipients vr ON v.id = vr.vasiyat_id
          LEFT JOIN members m ON v.creator_id = m.id
          WHERE vr.member_id = ?
        `;
        values.push(req.user.memberId);
        
        if (unlocked === 'true') {
          query += ' AND v.is_unlocked = true';
        } else if (unlocked === 'false') {
          query += ' AND v.is_unlocked = false';
        }
      } else {
        // Get vasiyats created by user
        query = `
          SELECT v.*,
            m.first_name as creator_first, m.last_name as creator_last, m.avatar_uri as creator_avatar
          FROM vasiyats v
          LEFT JOIN members m ON v.creator_id = m.id
          WHERE v.creator_id = ?
        `;
        values.push(req.user.memberId);
      }
      
      query += ' ORDER BY v.created_at DESC';
      
      const [vasiyats] = await pool.query(query, values) as any[];
      
      res.json({
        success: true,
        data: vasiyats.map((v: any) => this.formatVasiyat(v, req.user?.memberId === v.creator_id))
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get single vasiyat
   */
  getVasiyat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      // Check if user has access (creator or recipient)
      const [vasiyats] = await pool.query(`
        SELECT v.*, 
          m.first_name as creator_first, m.last_name as creator_last, m.avatar_uri as creator_avatar
        FROM vasiyats v
        LEFT JOIN members m ON v.creator_id = m.id
        WHERE v.id = ? AND v.family_id = ?
      `, [vasiyatId, req.user.familyId]) as any[];
      
      if (vasiyats.length === 0) {
        throw new AppError('Vasiyat not found', 404, 'VASIYAT_NOT_FOUND');
      }
      
      const vasiyat = vasiyats[0];
      const isCreator = vasiyat.creator_id === req.user.memberId;
      
      // Check if user is a recipient
      const [recipients] = await pool.query(
        'SELECT * FROM vasiyat_recipients WHERE vasiyat_id = ? AND member_id = ?',
        [vasiyatId, req.user.memberId]
      ) as any[];
      
      const isRecipient = recipients.length > 0;
      
      if (!isCreator && !isRecipient) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }
      
      // Get all recipients for creator view
      let recipientsList: any[] = [];
      if (isCreator) {
        const [allRecipients] = await pool.query(`
          SELECT vr.*, m.first_name, m.last_name, m.avatar_uri
          FROM vasiyat_recipients vr
          JOIN members m ON vr.member_id = m.id
          WHERE vr.vasiyat_id = ?
        `, [vasiyatId]) as any[];
        recipientsList = allRecipients;
      }
      
      const formatted = this.formatVasiyat(vasiyat, isCreator);
      
      // Hide content if not unlocked and user is recipient
      if (!isCreator && !vasiyat.is_unlocked) {
        formatted.contentText = null;
        formatted.contentAudioUri = null;
        formatted.contentVideoUri = null;
        formatted.contentAttachments = null;
      }
      
      if (isCreator) {
        (formatted as any).recipients = recipientsList.map((r: any) => ({
          memberId: r.member_id,
          name: `${r.first_name} ${r.last_name}`,
          avatarUri: r.avatar_uri,
          relationshipLabel: r.relationship_label,
          hasViewed: r.has_viewed,
          viewedAt: r.viewed_at
        }));
      }
      
      res.json({ success: true, data: formatted });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create vasiyat
   */
  createVasiyat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const {
        title, contentText, triggerType, triggerDate, triggerEvent,
        mood, allowAiPersona, recipients
      } = req.body;
      
      if (!title) {
        throw new AppError('Title is required', 400, 'MISSING_TITLE');
      }
      
      if (!triggerType) {
        throw new AppError('Trigger type is required', 400, 'MISSING_TRIGGER');
      }
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new AppError('At least one recipient is required', 400, 'MISSING_RECIPIENTS');
      }
      
      const conn = await pool.getConnection();
      
      try {
        await conn.beginTransaction();
        
        const vasiyatId = uuidv4();
        
        // Handle file attachments
        let contentAudioUri = null;
        let contentVideoUri = null;
        const attachments: string[] = [];
        
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            const uri = `/uploads/documents/${file.filename}`;
            if (file.mimetype.startsWith('audio/')) {
              contentAudioUri = uri;
            } else if (file.mimetype.startsWith('video/')) {
              contentVideoUri = uri;
            } else {
              attachments.push(uri);
            }
          }
        }
        
        await conn.query(`
          INSERT INTO vasiyats (
            id, family_id, creator_id, title, content_text,
            content_audio_uri, content_video_uri, content_attachments,
            trigger_type, trigger_date, trigger_event,
            mood, allow_ai_persona
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          vasiyatId, req.user.familyId, req.user.memberId,
          title, contentText || null,
          contentAudioUri, contentVideoUri,
          attachments.length > 0 ? JSON.stringify(attachments) : null,
          triggerType,
          triggerDate || null,
          triggerEvent || null,
          mood || 'loving',
          allowAiPersona || false
        ]);
        
        // Add recipients
        for (const recipient of recipients) {
          const recipientId = uuidv4();
          await conn.query(`
            INSERT INTO vasiyat_recipients (id, vasiyat_id, member_id, relationship_label)
            VALUES (?, ?, ?, ?)
          `, [recipientId, vasiyatId, recipient.memberId, recipient.relationshipLabel || null]);
        }
        
        await conn.commit();
        
        res.status(201).json({
          success: true,
          data: { id: vasiyatId, title }
        });
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update vasiyat
   */
  updateVasiyat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      const { title, contentText, triggerType, triggerDate, triggerEvent, mood } = req.body;
      
      // Verify ownership
      const [[vasiyat]] = await pool.query(
        'SELECT creator_id, is_unlocked FROM vasiyats WHERE id = ?',
        [vasiyatId]
      ) as any[];
      
      if (!vasiyat || vasiyat.creator_id !== req.user.memberId) {
        throw new AppError('Cannot update this vasiyat', 403, 'FORBIDDEN');
      }
      
      if (vasiyat.is_unlocked) {
        throw new AppError('Cannot update an unlocked vasiyat', 400, 'ALREADY_UNLOCKED');
      }
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (contentText !== undefined) { updates.push('content_text = ?'); values.push(contentText); }
      if (triggerType !== undefined) { updates.push('trigger_type = ?'); values.push(triggerType); }
      if (triggerDate !== undefined) { updates.push('trigger_date = ?'); values.push(triggerDate); }
      if (triggerEvent !== undefined) { updates.push('trigger_event = ?'); values.push(triggerEvent); }
      if (mood !== undefined) { updates.push('mood = ?'); values.push(mood); }
      
      if (updates.length === 0) {
        throw new AppError('No fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(vasiyatId);
      await pool.query(`UPDATE vasiyats SET ${updates.join(', ')} WHERE id = ?`, values);
      
      res.json({ success: true, message: 'Vasiyat updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete vasiyat
   */
  deleteVasiyat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      await pool.query(
        'DELETE FROM vasiyats WHERE id = ? AND creator_id = ?',
        [vasiyatId, req.user.memberId]
      );
      
      res.json({ success: true, message: 'Vasiyat deleted' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get recipients
   */
  getRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      const [recipients] = await pool.query(`
        SELECT vr.*, m.first_name, m.last_name, m.avatar_uri
        FROM vasiyat_recipients vr
        JOIN members m ON vr.member_id = m.id
        WHERE vr.vasiyat_id = ?
      `, [vasiyatId]) as any[];
      
      res.json({
        success: true,
        data: recipients.map((r: any) => ({
          memberId: r.member_id,
          name: `${r.first_name} ${r.last_name}`,
          avatarUri: r.avatar_uri,
          relationshipLabel: r.relationship_label,
          hasViewed: r.has_viewed,
          viewedAt: r.viewed_at
        }))
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Add recipient
   */
  addRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      const { memberId, relationshipLabel } = req.body;
      
      const recipientId = uuidv4();
      await pool.query(`
        INSERT INTO vasiyat_recipients (id, vasiyat_id, member_id, relationship_label)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE relationship_label = VALUES(relationship_label)
      `, [recipientId, vasiyatId, memberId, relationshipLabel || null]);
      
      res.json({ success: true, message: 'Recipient added' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Remove recipient
   */
  removeRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId, memberId } = req.params;
      
      await pool.query(
        'DELETE FROM vasiyat_recipients WHERE vasiyat_id = ? AND member_id = ?',
        [vasiyatId, memberId]
      );
      
      res.json({ success: true, message: 'Recipient removed' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Unlock vasiyat (for manual unlock or admin)
   */
  unlockVasiyat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      // Verify the user can unlock (creator only for manual unlock)
      const [[vasiyat]] = await pool.query(
        'SELECT creator_id, trigger_type, is_unlocked FROM vasiyats WHERE id = ?',
        [vasiyatId]
      ) as any[];
      
      if (!vasiyat) {
        throw new AppError('Vasiyat not found', 404, 'VASIYAT_NOT_FOUND');
      }
      
      if (vasiyat.is_unlocked) {
        throw new AppError('Vasiyat already unlocked', 400, 'ALREADY_UNLOCKED');
      }
      
      const isCreator = vasiyat.creator_id === req.user.memberId;
      
      // Only creator or admin can unlock
      if (!isCreator && req.user.role !== 'admin') {
        throw new AppError('Not authorized to unlock', 403, 'FORBIDDEN');
      }
      
      await pool.query(`
        UPDATE vasiyats SET 
          is_unlocked = true,
          unlocked_at = NOW()
        WHERE id = ?
      `, [vasiyatId]);
      
      res.json({ success: true, message: 'Vasiyat unlocked' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Request unlock (for recipients to request)
   */
  requestUnlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      // TODO: Implement notification to creator/approvers
      
      res.json({ success: true, message: 'Unlock request sent' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Check for pending unlocks (date-based triggers)
   */
  checkPendingUnlocks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      // Find vasiyats that should be unlocked based on date
      const [pending] = await pool.query(`
        SELECT id, title, trigger_date
        FROM vasiyats
        WHERE family_id = ?
          AND is_unlocked = false
          AND trigger_type = 'date'
          AND trigger_date <= CURDATE()
      `, [req.user.familyId]) as any[];
      
      // Auto-unlock them
      for (const v of pending) {
        await pool.query(`
          UPDATE vasiyats SET 
            is_unlocked = true,
            unlocked_at = NOW()
          WHERE id = ?
        `, [v.id]);
      }
      
      res.json({
        success: true,
        data: {
          unlocked: pending.length,
          vasiyats: pending.map((v: any) => ({ id: v.id, title: v.title }))
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Record view
   */
  recordView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { vasiyatId } = req.params;
      
      // Update view count
      await pool.query(
        'UPDATE vasiyats SET view_count = view_count + 1 WHERE id = ?',
        [vasiyatId]
      );
      
      // Mark as viewed by recipient
      await pool.query(`
        UPDATE vasiyat_recipients SET 
          has_viewed = true,
          viewed_at = NOW()
        WHERE vasiyat_id = ? AND member_id = ?
      `, [vasiyatId, req.user.memberId]);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
  
  // Helper to format vasiyat
  private formatVasiyat = (v: any, isCreator: boolean) => ({
    id: v.id,
    title: v.title,
    contentText: v.content_text,
    contentAudioUri: v.content_audio_uri,
    contentVideoUri: v.content_video_uri,
    contentAttachments: v.content_attachments ? JSON.parse(v.content_attachments) : null,
    triggerType: v.trigger_type,
    triggerDate: v.trigger_date,
    triggerEvent: v.trigger_event,
    triggerAge: v.trigger_age,
    isUnlocked: v.is_unlocked,
    unlockedAt: v.unlocked_at,
    mood: v.mood,
    allowAiPersona: v.allow_ai_persona,
    viewCount: v.view_count,
    creator: v.creator_first ? {
      id: v.creator_id,
      name: `${v.creator_first} ${v.creator_last}`,
      avatarUri: v.creator_avatar
    } : null,
    hasViewed: v.has_viewed,
    relationshipLabel: v.relationship_label,
    isCreator,
    createdAt: v.created_at
  });
}
