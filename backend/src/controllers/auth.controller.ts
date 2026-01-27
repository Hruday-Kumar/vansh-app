/**
 * 🪷 AUTH CONTROLLER
 */

import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

export class AuthController {
  /**
   * Register a new user and optionally create a new family
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, phone, password, memberName, familyName, surname } = req.body;
      
      if (!password || password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400, 'INVALID_PASSWORD');
      }
      
      if (!email && !phone) {
        throw new AppError('Email or phone is required', 400, 'MISSING_CONTACT');
      }
      
      // Split memberName into first and last name
      const nameParts = (memberName || '').trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || surname || '';
      
      const conn = await pool.getConnection();
      
      try {
        await conn.beginTransaction();
        
        // Check if user exists
        const [existing] = await conn.query(
          'SELECT id FROM users WHERE email = ?',
          [email || null]
        ) as any[];
        
        if (existing.length > 0) {
          throw new AppError('User already exists', 409, 'USER_EXISTS');
        }
        
        // Create family
        const familyId = uuidv4();
        await conn.query(`
          INSERT INTO families (id, name, surname, privacy_level, plan)
          VALUES (?, ?, ?, 'private', 'free')
        `, [familyId, familyName || `${lastName} Family`, surname || familyName]);
        
        // Create member for this user
        const memberId = uuidv4();
        await conn.query(`
          INSERT INTO members (id, family_id, first_name, last_name, gender, is_alive, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, 'other', true, ?, ?)
        `, [memberId, familyId, firstName, lastName, email, phone || null]);
        
        // Update family root member
        await conn.query('UPDATE families SET root_member_id = ? WHERE id = ?', [memberId, familyId]);
        
        // Create user
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);
        await conn.query(`
          INSERT INTO users (id, email, phone, password_hash, member_id, family_id, role, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, 'admin', true)
        `, [userId, email || null, phone || null, passwordHash, memberId, familyId]);
        
        await conn.commit();
        
        // Generate tokens
        const token = this.generateToken({ userId, memberId, familyId, email, role: 'admin' });
        const refreshToken = this.generateRefreshToken(userId);
        
        // Save refresh token
        await conn.query(`
          INSERT INTO user_sessions (id, user_id, refresh_token, expires_at)
          VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
        `, [uuidv4(), userId, refreshToken]);
        
        res.status(201).json({
          success: true,
          data: {
            token,
            refreshToken,
            user: { id: userId, email, memberId, familyId, role: 'admin' }
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Login with email/phone and password
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      if (!password) {
        throw new AppError('Password is required', 400, 'MISSING_PASSWORD');
      }
      
      if (!email) {
        throw new AppError('Email is required', 400, 'MISSING_EMAIL');
      }
      
      // Find user
      const [users] = await pool.query(`
        SELECT u.*, m.first_name, m.last_name, m.avatar_uri
        FROM users u
        LEFT JOIN members m ON u.member_id = m.id
        WHERE u.email = ?
      `, [email]) as any[];
      
      if (users.length === 0) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
      
      const user = users[0];
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
      
      // Generate tokens
      const token = this.generateToken({
        userId: user.id,
        memberId: user.member_id,
        familyId: user.family_id,
        email: user.email,
        role: user.role
      });
      const refreshToken = this.generateRefreshToken(user.id);
      
      // Save refresh token
      await pool.query(`
        INSERT INTO user_sessions (id, user_id, refresh_token, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [uuidv4(), user.id, refreshToken]);
      
      // Update last login
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      
      res.json({
        success: true,
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            memberId: user.member_id,
            familyId: user.family_id,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            avatarUri: user.avatar_uri
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new AppError('Refresh token required', 400, 'MISSING_TOKEN');
      }
      
      // Find session
      const [sessions] = await pool.query(`
        SELECT s.*, u.email, u.member_id, u.family_id, u.role
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token = ? AND s.expires_at > NOW()
      `, [refreshToken]) as any[];
      
      if (sessions.length === 0) {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
      }
      
      const session = sessions[0];
      
      // Generate new access token
      const token = this.generateToken({
        userId: session.user_id,
        memberId: session.member_id,
        familyId: session.family_id,
        email: session.email,
        role: session.role
      });
      
      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get current user info
   */
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }
      
      const [users] = await pool.query(`
        SELECT u.id, u.email, u.phone, u.member_id, u.family_id, u.role,
               m.first_name, m.last_name, m.avatar_uri, m.bio,
               f.name as family_name, f.surname as family_surname
        FROM users u
        LEFT JOIN members m ON u.member_id = m.id
        LEFT JOIN families f ON u.family_id = f.id
        WHERE u.id = ?
      `, [req.user.userId]) as any[];
      
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
          memberId: user.member_id,
          familyId: user.family_id,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUri: user.avatar_uri,
          bio: user.bio,
          familyName: user.family_name,
          familySurname: user.family_surname
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Logout - invalidate refresh token
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await pool.query('DELETE FROM user_sessions WHERE refresh_token = ?', [refreshToken]);
      } else if (req.user) {
        await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [req.user.userId]);
      }
      
      res.json({ success: true, message: 'Logged out successfully' });
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
        throw new AppError('Current and new password required', 400, 'MISSING_PASSWORD');
      }
      
      if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400, 'INVALID_PASSWORD');
      }
      
      // Get current password hash
      const [users] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[];
      
      if (users.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValid) {
        throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
      }
      
      // Update password
      const newHash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.userId]);
      
      // Invalidate all sessions
      await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [req.user.userId]);
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };
  
  // Helper methods
  private generateToken(payload: {
    userId: string;
    memberId: string;
    familyId: string;
    email: string;
    role: string;
  }): string {
    const secret = process.env.JWT_SECRET || 'vansh_secret';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }
  
  private generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'vansh_secret';
    return jwt.sign({ userId, type: 'refresh' }, secret, { expiresIn: '30d' });
  }
}
