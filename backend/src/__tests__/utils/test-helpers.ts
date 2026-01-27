/**
 * 🪷 Test Utilities
 * Mock database and helper functions for testing
 */

import { NextFunction, Response } from 'express';

// Auth payload type (matches the one in auth.ts)
type UserRole = 'admin' | 'elder' | 'member' | 'viewer';

export interface TestAuthPayload {
  userId: string;
  memberId: string;
  familyId: string;
  email: string;
  role: UserRole;
}

// ═══════════════════════════════════════════════════════════
// MOCK DATABASE
// ═══════════════════════════════════════════════════════════

export interface MockConnection {
  query: jest.Mock;
  beginTransaction: jest.Mock;
  commit: jest.Mock;
  rollback: jest.Mock;
  release: jest.Mock;
}

export interface MockPool {
  query: jest.Mock;
  getConnection: jest.Mock;
}

export function createMockPool(): MockPool {
  const mockConnection: MockConnection = {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };

  return {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue(mockConnection),
  };
}

export function createMockConnection(): MockConnection {
  return {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

// ═══════════════════════════════════════════════════════════
// MOCK REQUEST/RESPONSE
// ═══════════════════════════════════════════════════════════

export interface MockRequest {
  body: Record<string, any>;
  params: Record<string, string>;
  query: Record<string, any>;
  user?: TestAuthPayload;
  headers: Record<string, string>;
}

export interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
}

export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

export function createMockResponse(): MockResponse {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

export function createMockNext(): jest.Mock<NextFunction> {
  return jest.fn();
}

// ═══════════════════════════════════════════════════════════
// TEST DATA GENERATORS
// ═══════════════════════════════════════════════════════════

export function createTestUser(overrides: Partial<{
  id: string;
  email: string;
  password_hash: string;
  member_id: string;
  family_id: string;
  role: string;
  first_name: string;
  last_name: string;
}> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: '$2a$10$hashedpassword',
    member_id: 'member-123',
    family_id: 'family-123',
    role: 'admin',
    first_name: 'Test',
    last_name: 'User',
    avatar_uri: null,
    phone: null,
    ...overrides,
  };
}

export function createTestFamily(overrides: Partial<{
  id: string;
  name: string;
  surname: string;
}> = {}) {
  return {
    id: 'family-123',
    name: 'Test Family',
    surname: 'Tester',
    privacy_level: 'private',
    plan: 'free',
    root_member_id: 'member-123',
    ...overrides,
  };
}

export function createTestMember(overrides: Partial<{
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
}> = {}) {
  return {
    id: 'member-123',
    family_id: 'family-123',
    first_name: 'Test',
    last_name: 'Member',
    gender: 'other',
    is_alive: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// ASSERTION HELPERS
// ═══════════════════════════════════════════════════════════

export function expectSuccessResponse(res: MockResponse, statusCode = 200) {
  if (statusCode !== 200) {
    expect(res.status).toHaveBeenCalledWith(statusCode);
  }
  expect(res.json).toHaveBeenCalled();
  const response = res.json.mock.calls[0][0];
  expect(response.success).toBe(true);
  return response;
}

export function expectErrorResponse(next: jest.Mock, errorCode: string) {
  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.code).toBe(errorCode);
  return error;
}
