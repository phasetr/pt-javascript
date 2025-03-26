/**
 * ユーザーエンドポイントのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { userRouter } from './users.js';

// モックリポジトリ
const mockUserRepository = {
  getUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserByEmail: vi.fn()
};

// モジュールのモック
vi.mock('../db.js', () => ({
  userRepository: mockUserRepository
}));

// UUIDのモック
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

describe('User Router', () => {
  let app: Hono;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // テスト用アプリケーションを作成
    app = new Hono();
    app.route('/users', userRouter);
  });

  describe('GET /users/:userId', () => {
    it('should return 404 when user is not found', async () => {
      // モックの設定
      mockUserRepository.getUser.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/users/nonexistent');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('nonexistent');
    });

    it('should return user when found', async () => {
      // モックの設定
      const mockUser = {
        PK: 'USER#user123',
        SK: 'PROFILE',
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockUserRepository.getUser.mockResolvedValue(mockUser);

      // リクエスト
      const res = await app.request('/users/user123');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      // モックの設定
      const userData = {
        email: 'new@example.com',
        name: 'New User'
      };
      const createdUser = {
        PK: 'USER#mock-uuid',
        SK: 'PROFILE',
        userId: 'mock-uuid',
        email: 'new@example.com',
        name: 'New User',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockUserRepository.createUser.mockResolvedValue(createdUser);

      // リクエスト
      const res = await app.request('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(201);
      expect(data).toEqual(createdUser);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        userId: 'mock-uuid',
        email: 'new@example.com',
        name: 'New User'
      });
    });

    it('should validate input data', async () => {
      // 不正なデータ
      const invalidData = {
        email: 'invalid-email',
        name: ''
      };

      // リクエスト
      const res = await app.request('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      // 検証
      expect(res.status).toBe(400); // バリデーションエラー
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('PUT /users/:userId', () => {
    it('should update an existing user', async () => {
      // モックの設定
      const existingUser = {
        PK: 'USER#user123',
        SK: 'PROFILE',
        userId: 'user123',
        email: 'old@example.com',
        name: 'Old Name',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
        name: 'New Name',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      mockUserRepository.getUser.mockResolvedValue(existingUser);
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);

      // リクエスト
      const res = await app.request('/users/user123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'new@example.com',
          name: 'New Name'
        })
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(updatedUser);
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('user123');
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith('user123', {
        email: 'new@example.com',
        name: 'New Name'
      });
    });

    it('should return 404 when updating non-existent user', async () => {
      // モックの設定
      mockUserRepository.getUser.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/users/nonexistent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'New Name'
        })
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should delete an existing user', async () => {
      // モックの設定
      const existingUser = {
        PK: 'USER#user123',
        SK: 'PROFILE',
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockUserRepository.getUser.mockResolvedValue(existingUser);
      mockUserRepository.deleteUser.mockResolvedValue(undefined);

      // リクエスト
      const res = await app.request('/users/user123', {
        method: 'DELETE'
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data.message).toBe('User deleted successfully');
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('user123');
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith('user123');
    });

    it('should return 404 when deleting non-existent user', async () => {
      // モックの設定
      mockUserRepository.getUser.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/users/nonexistent', {
        method: 'DELETE'
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockUserRepository.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('GET /users/email/:email', () => {
    it('should return user when found by email', async () => {
      // モックの設定
      const mockUser = {
        PK: 'USER#user123',
        SK: 'PROFILE',
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockUserRepository.getUserByEmail.mockResolvedValue(mockUser);

      // リクエスト
      const res = await app.request('/users/email/test@example.com');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 404 when user is not found by email', async () => {
      // モックの設定
      mockUserRepository.getUserByEmail.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/users/email/nonexistent@example.com');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });
  });
});
