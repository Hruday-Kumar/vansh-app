/**
 * 🪷 FAMILY CONTROLLER
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

export class FamilyController {
  /**
   * Get user's family
   */
  getFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const [families] = await pool.query(`
        SELECT f.*, m.first_name as root_first_name, m.last_name as root_last_name
        FROM families f
        LEFT JOIN members m ON f.root_member_id = m.id
        WHERE f.id = ?
      `, [req.user.familyId]) as any[];
      
      if (families.length === 0) {
        throw new AppError('Family not found', 404, 'FAMILY_NOT_FOUND');
      }
      
      const family = families[0];
      
      res.json({
        success: true,
        data: {
          id: family.id,
          name: family.name,
          surname: family.surname,
          description: family.description,
          rootMemberId: family.root_member_id,
          rootMemberName: family.root_first_name ? `${family.root_first_name} ${family.root_last_name}` : null,
          privacyLevel: family.privacy_level,
          allowDigitalEcho: family.allow_digital_echo,
          plan: family.plan,
          storageUsed: family.storage_used_bytes,
          storageLimit: family.storage_limit_bytes,
          settings: family.settings ? JSON.parse(family.settings) : {},
          createdAt: family.created_at,
          lastActivityAt: family.last_activity_at
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create a new family
   */
  createFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { name, surname, description, privacyLevel } = req.body;
      
      if (!name || !surname) {
        throw new AppError('Name and surname are required', 400, 'MISSING_FIELDS');
      }
      
      const familyId = uuidv4();
      await pool.query(`
        INSERT INTO families (id, name, surname, description, privacy_level)
        VALUES (?, ?, ?, ?, ?)
      `, [familyId, name, surname, description || null, privacyLevel || 'private']);
      
      // Update user's family
      await pool.query('UPDATE users SET family_id = ? WHERE id = ?', [familyId, req.user.userId]);
      
      res.status(201).json({
        success: true,
        data: { id: familyId, name, surname }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update family
   */
  updateFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { familyId } = req.params;
      const { name, surname, description, privacyLevel, allowDigitalEcho } = req.body;
      
      if (familyId !== req.user.familyId) {
        throw new AppError('Cannot update another family', 403, 'FORBIDDEN');
      }
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name) { updates.push('name = ?'); values.push(name); }
      if (surname) { updates.push('surname = ?'); values.push(surname); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (privacyLevel) { updates.push('privacy_level = ?'); values.push(privacyLevel); }
      if (allowDigitalEcho !== undefined) { updates.push('allow_digital_echo = ?'); values.push(allowDigitalEcho); }
      
      if (updates.length === 0) {
        throw new AppError('No fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(familyId);
      await pool.query(`UPDATE families SET ${updates.join(', ')} WHERE id = ?`, values);
      
      res.json({ success: true, message: 'Family updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete family
   */
  deleteFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { familyId } = req.params;
      
      if (familyId !== req.user.familyId) {
        throw new AppError('Cannot delete another family', 403, 'FORBIDDEN');
      }
      
      await pool.query('DELETE FROM families WHERE id = ?', [familyId]);
      
      res.json({ success: true, message: 'Family deleted' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get family settings
   */
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const [families] = await pool.query(
        'SELECT settings FROM families WHERE id = ?',
        [req.user.familyId]
      ) as any[];
      
      res.json({
        success: true,
        data: families[0]?.settings ? JSON.parse(families[0].settings) : {}
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update family settings
   */
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { familyId } = req.params;
      const settings = req.body;
      
      await pool.query(
        'UPDATE families SET settings = ? WHERE id = ?',
        [JSON.stringify(settings), familyId]
      );
      
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get family stats
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const familyId = req.user.familyId;
      
      // Get counts
      const [[memberCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM members WHERE family_id = ?',
        [familyId]
      ) as any[];
      
      const [[memoryCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM memories WHERE family_id = ?',
        [familyId]
      ) as any[];
      
      const [[kathaCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM kathas WHERE family_id = ?',
        [familyId]
      ) as any[];
      
      const [[vasiyatCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM vasiyats WHERE family_id = ?',
        [familyId]
      ) as any[];
      
      const [[traditionCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM traditions WHERE family_id = ?',
        [familyId]
      ) as any[];
      
      const [[livingCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM members WHERE family_id = ? AND is_alive = true',
        [familyId]
      ) as any[];
      
      res.json({
        success: true,
        data: {
          totalMembers: memberCount.count,
          livingMembers: livingCount.count,
          totalMemories: memoryCount.count,
          totalKathas: kathaCount.count,
          totalVasiyats: vasiyatCount.count,
          totalTraditions: traditionCount.count
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get family traditions
   */
  getTraditions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { category, search } = req.query;
      
      let query = `
        SELECT t.*, m.first_name as creator_first_name, m.last_name as creator_last_name
        FROM traditions t
        LEFT JOIN members m ON t.created_by = m.id
        WHERE t.family_id = ?
      `;
      const values: any[] = [req.user.familyId];
      
      if (category) {
        query += ' AND t.category = ?';
        values.push(category);
      }
      
      if (search) {
        query += ' AND (t.name LIKE ? OR t.description LIKE ?)';
        values.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY t.created_at DESC';
      
      const [traditions] = await pool.query(query, values) as any[];
      
      res.json({
        success: true,
        data: traditions.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          frequency: t.frequency,
          dateOrOccasion: t.date_or_occasion,
          coverImageUri: t.cover_image_url,
          recipeIngredients: t.recipe_ingredients ? JSON.parse(t.recipe_ingredients) : null,
          recipeSteps: t.recipe_steps ? JSON.parse(t.recipe_steps) : null,
          originStory: t.origin_story,
          significance: t.significance,
          generationsCount: t.generations_count,
          isActive: t.is_active,
          region: t.region,
          tags: t.tags ? JSON.parse(t.tags) : [],
          createdBy: t.creator_first_name ? `${t.creator_first_name} ${t.creator_last_name}` : null,
          createdAt: t.created_at
        }))
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create tradition
   */
  createTradition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const {
        name, description, category, frequency, dateOrOccasion,
        recipeIngredients, recipeSteps,
        originStory, tags
      } = req.body;
      
      if (!name) {
        throw new AppError('Tradition name is required', 400, 'MISSING_NAME');
      }
      
      const traditionId = uuidv4();
      await pool.query(`
        INSERT INTO traditions (
          id, family_id, created_by, name, description, category,
          frequency, date_or_occasion, recipe_ingredients, recipe_steps,
          origin_story, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        traditionId, req.user.familyId, req.user.memberId,
        name, description || null, category || 'other',
        frequency || 'yearly', dateOrOccasion || null,
        recipeIngredients ? JSON.stringify(recipeIngredients) : null,
        recipeSteps ? JSON.stringify(recipeSteps) : null,
        originStory || null,
        tags ? JSON.stringify(tags) : null
      ]);
      
      res.status(201).json({
        success: true,
        data: { id: traditionId, name }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update tradition
   */
  updateTradition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { traditionId } = req.params;
      const updates = req.body;
      
      const allowedFields = [
        'name', 'description', 'category', 'frequency', 'date_or_occasion',
        'cover_image_uri', 'gallery_images', 'recipe_ingredients', 'recipe_steps',
        'lyrics', 'audio_uri', 'instructions', 'tips', 'origin_story',
        'started_year', 'generations_count', 'is_active', 'tags'
      ];
      
      const setClauses: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        if (allowedFields.includes(dbKey)) {
          setClauses.push(`${dbKey} = ?`);
          values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }
      
      if (setClauses.length === 0) {
        throw new AppError('No valid fields to update', 400, 'NO_UPDATES');
      }
      
      values.push(traditionId, req.user.familyId);
      await pool.query(
        `UPDATE traditions SET ${setClauses.join(', ')} WHERE id = ? AND family_id = ?`,
        values
      );
      
      res.json({ success: true, message: 'Tradition updated' });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete tradition
   */
  deleteTradition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const { traditionId } = req.params;
      
      await pool.query(
        'DELETE FROM traditions WHERE id = ? AND family_id = ?',
        [traditionId, req.user.familyId]
      );
      
      res.json({ success: true, message: 'Tradition deleted' });
    } catch (error) {
      next(error);
    }
  };
}
