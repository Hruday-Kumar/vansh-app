/**
 * 🪷 AUTH CONTROLLER TESTS
 * Unit tests for authentication functionality
 */

import bcrypt from 'bcryptjs';
import { AuthController } from '../../controllers/auth.controller';
import {
    createMockConnection,
    createMockNext,
    createMockRequest,
    createMockResponse,
    createTestUser,
    expectErrorResponse,
    expectSuccessResponse,
} from '../utils/test-helpers';

// Mock the database pool
jest.mock('../../config/database', () => {
  const mockConnection = {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
  
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(mockConnection),
    },
    testConnection: jest.fn().mockResolvedValue(true),
    closePool: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-123'),
}));

// Get the mocked pool
import pool from '../../config/database';
const mockPool = pool as jest.Mocked<typeof pool>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockConnection: ReturnType<typeof createMockConnection>;

  beforeEach(() => {
    authController = new AuthController();
    mockConnection = createMockConnection();
    (mockPool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // REGISTER TESTS
  // ═══════════════════════════════════════════════════════════

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = createMockRequest({
        body: {
          email: 'new@example.com',
          password: 'password123',
          memberName: 'John Doe',
          familyName: 'Doe Family',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: no existing user
      mockConnection.query.mockResolvedValueOnce([[]]);
      // Mock: insert family
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: insert member
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update family root
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: insert user
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: insert session
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authController.register(req as any, res as any, next);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.refreshToken).toBeDefined();
      expect(response.data.user.email).toBe('new@example.com');
    });

    it('should reject registration with short password', async () => {
      const req = createMockRequest({
        body: {
          email: 'new@example.com',
          password: '123', // Too short
          memberName: 'John Doe',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.register(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_PASSWORD');
    });

    it('should reject registration without email or phone', async () => {
      const req = createMockRequest({
        body: {
          password: 'password123',
          memberName: 'John Doe',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.register(req as any, res as any, next);

      expectErrorResponse(next, 'MISSING_CONTACT');
    });

    it('should reject registration if user already exists', async () => {
      const req = createMockRequest({
        body: {
          email: 'existing@example.com',
          password: 'password123',
          memberName: 'John Doe',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: existing user found
      mockConnection.query.mockResolvedValueOnce([[{ id: 'existing-user' }]]);

      await authController.register(req as any, res as any, next);

      expectErrorResponse(next, 'USER_EXISTS');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // LOGIN TESTS
  // ═══════════════════════════════════════════════════════════

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const testUser = createTestUser();
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: find user
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[testUser]]);
      // Mock: bcrypt compare success
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      // Mock: insert session
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update last login
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authController.login(req as any, res as any, next);

      const response = expectSuccessResponse(res);
      expect(response.data.token).toBeDefined();
      expect(response.data.refreshToken).toBeDefined();
      expect(response.data.user.email).toBe('test@example.com');
    });

    it('should reject login with missing password', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.login(req as any, res as any, next);

      expectErrorResponse(next, 'MISSING_PASSWORD');
    });

    it('should reject login with missing email', async () => {
      const req = createMockRequest({
        body: {
          password: 'password123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.login(req as any, res as any, next);

      expectErrorResponse(next, 'MISSING_EMAIL');
    });

    it('should reject login with non-existent user', async () => {
      const req = createMockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: no user found
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[]]);

      await authController.login(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_CREDENTIALS');
    });

    it('should reject login with wrong password', async () => {
      const testUser = createTestUser();
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: find user
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[testUser]]);
      // Mock: bcrypt compare fails
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await authController.login(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_CREDENTIALS');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REFRESH TOKEN TESTS
  // ═══════════════════════════════════════════════════════════

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const req = createMockRequest({
        body: {
          refreshToken: 'valid-refresh-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: find valid session
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[{
        user_id: 'user-123',
        member_id: 'member-123',
        family_id: 'family-123',
        email: 'test@example.com',
        role: 'admin',
      }]]);

      await authController.refreshToken(req as any, res as any, next);

      const response = expectSuccessResponse(res);
      expect(response.data.token).toBeDefined();
    });

    it('should reject refresh with missing token', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.refreshToken(req as any, res as any, next);

      expectErrorResponse(next, 'MISSING_TOKEN');
    });

    it('should reject refresh with invalid token', async () => {
      const req = createMockRequest({
        body: {
          refreshToken: 'invalid-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: no session found
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[]]);

      await authController.refreshToken(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_TOKEN');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET ME TESTS
  // ═══════════════════════════════════════════════════════════

  describe('getMe', () => {
    it('should return current user info', async () => {
      const testUser = createTestUser();
      const req = createMockRequest({
        user: {
          userId: 'user-123',
          memberId: 'member-123',
          familyId: 'family-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: find user with details
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[{
        ...testUser,
        family_name: 'Test Family',
        family_surname: 'Tester',
      }]]);

      await authController.getMe(req as any, res as any, next);

      const response = expectSuccessResponse(res);
      expect(response.data.email).toBe('test@example.com');
      expect(response.data.familyName).toBe('Test Family');
    });

    it('should reject if not authenticated', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      await authController.getMe(req as any, res as any, next);

      expectErrorResponse(next, 'UNAUTHORIZED');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // LOGOUT TESTS
  // ═══════════════════════════════════════════════════════════

  describe('logout', () => {
    it('should logout successfully with refresh token', async () => {
      const req = createMockRequest({
        body: {
          refreshToken: 'some-refresh-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: delete session
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authController.logout(req as any, res as any, next);

      const response = expectSuccessResponse(res);
      expect(response.message).toBe('Logged out successfully');
    });

    it('should logout all sessions if no refresh token but user is authenticated', async () => {
      const req = createMockRequest({
        user: {
          userId: 'user-123',
          memberId: 'member-123',
          familyId: 'family-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: delete all sessions for user
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 2 }]);

      await authController.logout(req as any, res as any, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM user_sessions WHERE user_id = ?',
        ['user-123']
      );
      const response = expectSuccessResponse(res);
      expect(response.message).toBe('Logged out successfully');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CHANGE PASSWORD TESTS
  // ═══════════════════════════════════════════════════════════

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const req = createMockRequest({
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        },
        user: {
          userId: 'user-123',
          memberId: 'member-123',
          familyId: 'family-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: get current password hash
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[{ password_hash: 'oldhash' }]]);
      // Mock: bcrypt compare success
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      // Mock: update password
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: delete sessions
      (mockPool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authController.changePassword(req as any, res as any, next);

      const response = expectSuccessResponse(res);
      expect(response.message).toBe('Password changed successfully');
    });

    it('should reject if not authenticated', async () => {
      const req = createMockRequest({
        body: {
          currentPassword: 'old',
          newPassword: 'newpassword123',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.changePassword(req as any, res as any, next);

      expectErrorResponse(next, 'UNAUTHORIZED');
    });

    it('should reject with wrong current password', async () => {
      const req = createMockRequest({
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        },
        user: {
          userId: 'user-123',
          memberId: 'member-123',
          familyId: 'family-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock: get current password hash
      (mockPool.query as jest.Mock).mockResolvedValueOnce([[{ password_hash: 'currenthash' }]]);
      // Mock: bcrypt compare fails
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await authController.changePassword(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_PASSWORD');
    });

    it('should reject with short new password', async () => {
      const req = createMockRequest({
        body: {
          currentPassword: 'oldpassword',
          newPassword: '123', // Too short
        },
        user: {
          userId: 'user-123',
          memberId: 'member-123',
          familyId: 'family-123',
          email: 'test@example.com',
          role: 'admin',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authController.changePassword(req as any, res as any, next);

      expectErrorResponse(next, 'INVALID_PASSWORD');
    });
  });
});
