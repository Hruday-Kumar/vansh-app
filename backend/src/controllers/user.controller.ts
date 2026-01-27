/**
 * 🪷 USER CONTROLLER - User profile and settings management
 */

import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

export class UserController {
  /**
   * Get user profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const [users] = await pool.query(
        `SELECT 
          u.id, u.email, u.phone, u.role, u.is_verified,
          u.language, u.notification_settings, u.created_at,
          m.id as member_id, m.first_name, m.last_name, m.avatar_uri,
          m.birth_date, m.occupation, m.bio,
          f.id as family_id, f.name as family_name, f.surname
        FROM users u
        LEFT JOIN members m ON u.member_id = m.id
        LEFT JOIN families f ON u.family_id = f.id
        WHERE u.id = ?`,
        [req.user.userId]
      ) as any[];

      if (users.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const user = users[0];
      
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.is_verified,
          language: user.language,
          notificationSettings: user.notification_settings 
            ? JSON.parse(user.notification_settings) 
            : { push: true, email: true, sms: false },
          createdAt: user.created_at,
          member: user.member_id ? {
            id: user.member_id,
            firstName: user.first_name,
            lastName: user.last_name,
            avatarUri: user.avatar_uri,
            birthDate: user.birth_date,
            occupation: user.occupation,
            bio: user.bio,
          } : null,
          family: {
            id: user.family_id,
            name: user.family_name,
            surname: user.surname,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { firstName, lastName, phone, language, avatarUri, birthDate, occupation, bio } = req.body;

      // Update user table
      const userUpdates: string[] = [];
      const userValues: any[] = [];

      if (phone !== undefined) {
        userUpdates.push('phone = ?');
        userValues.push(phone);
      }
      if (language !== undefined) {
        userUpdates.push('language = ?');
        userValues.push(language);
      }

      if (userUpdates.length > 0) {
        userValues.push(req.user.userId);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
          userValues
        );
      }

      // Get member_id
      const [users] = await pool.query(
        'SELECT member_id FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[];

      // Update member table if linked
      if (users[0]?.member_id) {
        const memberUpdates: string[] = [];
        const memberValues: any[] = [];

        if (firstName !== undefined) {
          memberUpdates.push('first_name = ?');
          memberValues.push(firstName);
        }
        if (lastName !== undefined) {
          memberUpdates.push('last_name = ?');
          memberValues.push(lastName);
        }
        if (avatarUri !== undefined) {
          memberUpdates.push('avatar_uri = ?');
          memberValues.push(avatarUri);
        }
        if (birthDate !== undefined) {
          memberUpdates.push('birth_date = ?');
          memberValues.push(birthDate);
        }
        if (occupation !== undefined) {
          memberUpdates.push('occupation = ?');
          memberValues.push(occupation);
        }
        if (bio !== undefined) {
          memberUpdates.push('bio = ?');
          memberValues.push(bio);
        }

        if (memberUpdates.length > 0) {
          memberValues.push(users[0].member_id);
          await pool.query(
            `UPDATE members SET ${memberUpdates.join(', ')} WHERE id = ?`,
            memberValues
          );
        }
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user settings/preferences
   */
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const [users] = await pool.query(
        'SELECT notification_settings, language FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[];

      const [families] = await pool.query(
        'SELECT settings FROM families WHERE id = ?',
        [req.user.familyId]
      ) as any[];

      const userSettings = users[0];
      const familySettings = families[0]?.settings 
        ? JSON.parse(families[0].settings) 
        : {};

      res.json({
        success: true,
        data: {
          notifications: userSettings?.notification_settings
            ? JSON.parse(userSettings.notification_settings)
            : { push: true, email: true, sms: false, memories: true, stories: true },
          language: userSettings?.language || 'en',
          theme: familySettings.theme || 'light',
          autoBackup: familySettings.autoBackup ?? true,
          highQualityMedia: familySettings.highQualityMedia ?? true,
          showAgeOnTree: familySettings.showAgeOnTree ?? true,
          soundEffects: familySettings.soundEffects ?? true,
          biometricLock: familySettings.biometricLock ?? false,
          offlineMode: familySettings.offlineMode ?? false,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user settings/preferences
   */
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { 
        notifications, 
        language,
        theme,
        autoBackup,
        highQualityMedia,
        showAgeOnTree,
        soundEffects,
        biometricLock,
        offlineMode,
      } = req.body;

      // Update user-level settings
      const userUpdates: string[] = [];
      const userValues: any[] = [];

      if (notifications !== undefined) {
        userUpdates.push('notification_settings = ?');
        userValues.push(JSON.stringify(notifications));
      }
      if (language !== undefined) {
        userUpdates.push('language = ?');
        userValues.push(language);
      }

      if (userUpdates.length > 0) {
        userValues.push(req.user.userId);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
          userValues
        );
      }

      // Update family-level settings
      const familySettings: Record<string, any> = {};
      if (theme !== undefined) familySettings.theme = theme;
      if (autoBackup !== undefined) familySettings.autoBackup = autoBackup;
      if (highQualityMedia !== undefined) familySettings.highQualityMedia = highQualityMedia;
      if (showAgeOnTree !== undefined) familySettings.showAgeOnTree = showAgeOnTree;
      if (soundEffects !== undefined) familySettings.soundEffects = soundEffects;
      if (biometricLock !== undefined) familySettings.biometricLock = biometricLock;
      if (offlineMode !== undefined) familySettings.offlineMode = offlineMode;

      if (Object.keys(familySettings).length > 0) {
        // Get existing settings
        const [families] = await pool.query(
          'SELECT settings FROM families WHERE id = ?',
          [req.user.familyId]
        ) as any[];

        const existingSettings = families[0]?.settings 
          ? JSON.parse(families[0].settings) 
          : {};

        const mergedSettings = { ...existingSettings, ...familySettings };

        await pool.query(
          'UPDATE families SET settings = ? WHERE id = ?',
          [JSON.stringify(mergedSettings), req.user.familyId]
        );
      }

      res.json({
        success: true,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current and new password are required', 400, 'MISSING_FIELDS');
      }

      if (newPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400, 'WEAK_PASSWORD');
      }

      // Verify current password
      const [users] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[];

      if (users.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValid) {
        throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, req.user.userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete account
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const { password, confirmation } = req.body;

      if (confirmation !== 'DELETE MY ACCOUNT') {
        throw new AppError('Please type "DELETE MY ACCOUNT" to confirm', 400, 'CONFIRMATION_REQUIRED');
      }

      // Verify password
      const [users] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[];

      if (users.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const isValid = await bcrypt.compare(password, users[0].password_hash);
      if (!isValid) {
        throw new AppError('Password is incorrect', 401, 'INVALID_PASSWORD');
      }

      // Delete user (cascades to sessions)
      await pool.query('DELETE FROM users WHERE id = ?', [req.user.userId]);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
