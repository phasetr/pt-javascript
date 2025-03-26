/**
 * タスクエンドポイントのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { taskRouter } from './tasks.js';
import { TaskStatus } from '@ctld/db-lib';

// モックリポジトリ
const mockTaskRepository = {
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  listTasksByUser: vi.fn(),
  listTasksByStatus: vi.fn()
};

// モジュールのモック
vi.mock('../db.js', () => ({
  taskRepository: mockTaskRepository
}));

// UUIDのモック
vi.mock('uuid', () => ({
  v4: () => 'mock-task-id'
}));

describe('Task Router', () => {
  let app: Hono;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // テスト用アプリケーションを作成
    app = new Hono();
    app.route('/tasks', taskRouter);
  });

  describe('GET /tasks/user/:userId', () => {
    it('should return tasks for a user', async () => {
      // モックの設定
      const mockTasks = [
        {
          PK: 'USER#user123',
          SK: 'TASK#task1',
          userId: 'user123',
          taskId: 'task1',
          title: 'Task 1',
          status: TaskStatus.TODO,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          PK: 'USER#user123',
          SK: 'TASK#task2',
          userId: 'user123',
          taskId: 'task2',
          title: 'Task 2',
          status: TaskStatus.IN_PROGRESS,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];
      mockTaskRepository.listTasksByUser.mockResolvedValue(mockTasks);

      // リクエスト
      const res = await app.request('/tasks/user/user123');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(mockTasks);
      expect(mockTaskRepository.listTasksByUser).toHaveBeenCalledWith('user123');
    });

    it('should return empty array when user has no tasks', async () => {
      // モックの設定
      mockTaskRepository.listTasksByUser.mockResolvedValue([]);

      // リクエスト
      const res = await app.request('/tasks/user/user123');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
      expect(mockTaskRepository.listTasksByUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('GET /tasks/user/:userId/status/:status', () => {
    it('should return tasks filtered by status', async () => {
      // モックの設定
      const mockTasks = [
        {
          PK: 'USER#user123',
          SK: 'TASK#task1',
          userId: 'user123',
          taskId: 'task1',
          title: 'Task 1',
          status: TaskStatus.TODO,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];
      mockTaskRepository.listTasksByStatus.mockResolvedValue(mockTasks);

      // リクエスト
      const res = await app.request('/tasks/user/user123/status/TODO');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(mockTasks);
      expect(mockTaskRepository.listTasksByStatus).toHaveBeenCalledWith('user123', TaskStatus.TODO);
    });

    it('should return 400 for invalid status', async () => {
      // リクエスト
      const res = await app.request('/tasks/user/user123/status/INVALID');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid status parameter');
      expect(mockTaskRepository.listTasksByStatus).not.toHaveBeenCalled();
    });
  });

  describe('GET /tasks/:taskId/user/:userId', () => {
    it('should return task when found', async () => {
      // モックの設定
      const mockTask = {
        PK: 'USER#user123',
        SK: 'TASK#task1',
        userId: 'user123',
        taskId: 'task1',
        title: 'Task 1',
        status: TaskStatus.TODO,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockTaskRepository.getTask.mockResolvedValue(mockTask);

      // リクエスト
      const res = await app.request('/tasks/task1/user/user123');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(mockTask);
      expect(mockTaskRepository.getTask).toHaveBeenCalledWith('user123', 'task1');
    });

    it('should return 404 when task is not found', async () => {
      // モックの設定
      mockTaskRepository.getTask.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/tasks/nonexistent/user/user123');
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('Task not found');
      expect(mockTaskRepository.getTask).toHaveBeenCalledWith('user123', 'nonexistent');
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      // モックの設定
      const taskData = {
        userId: 'user123',
        title: 'New Task',
        description: 'Task description'
      };
      const createdTask = {
        PK: 'USER#user123',
        SK: 'TASK#mock-task-id',
        userId: 'user123',
        taskId: 'mock-task-id',
        title: 'New Task',
        description: 'Task description',
        status: TaskStatus.TODO,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockTaskRepository.createTask.mockResolvedValue(createdTask);

      // リクエスト
      const res = await app.request('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(201);
      expect(data).toEqual(createdTask);
      expect(mockTaskRepository.createTask).toHaveBeenCalledWith({
        userId: 'user123',
        taskId: 'mock-task-id',
        title: 'New Task',
        description: 'Task description'
      });
    });

    it('should validate input data', async () => {
      // 不正なデータ
      const invalidData = {
        userId: '',
        title: ''
      };

      // リクエスト
      const res = await app.request('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      // 検証
      expect(res.status).toBe(400); // バリデーションエラー
      expect(mockTaskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe('PUT /tasks/:taskId/user/:userId', () => {
    it('should update an existing task', async () => {
      // モックの設定
      const existingTask = {
        PK: 'USER#user123',
        SK: 'TASK#task1',
        userId: 'user123',
        taskId: 'task1',
        title: 'Old Title',
        status: TaskStatus.TODO,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const updatedTask = {
        ...existingTask,
        title: 'New Title',
        status: TaskStatus.IN_PROGRESS,
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      mockTaskRepository.getTask.mockResolvedValue(existingTask);
      mockTaskRepository.updateTask.mockResolvedValue(updatedTask);

      // リクエスト
      const res = await app.request('/tasks/task1/user/user123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Title',
          status: TaskStatus.IN_PROGRESS
        })
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data).toEqual(updatedTask);
      expect(mockTaskRepository.getTask).toHaveBeenCalledWith('user123', 'task1');
      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith('user123', 'task1', {
        title: 'New Title',
        status: TaskStatus.IN_PROGRESS
      });
    });

    it('should return 404 when updating non-existent task', async () => {
      // モックの設定
      mockTaskRepository.getTask.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/tasks/nonexistent/user/user123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Title'
        })
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('Task not found');
      expect(mockTaskRepository.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /tasks/:taskId/user/:userId', () => {
    it('should delete an existing task', async () => {
      // モックの設定
      const existingTask = {
        PK: 'USER#user123',
        SK: 'TASK#task1',
        userId: 'user123',
        taskId: 'task1',
        title: 'Task 1',
        status: TaskStatus.TODO,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      mockTaskRepository.getTask.mockResolvedValue(existingTask);
      mockTaskRepository.deleteTask.mockResolvedValue(undefined);

      // リクエスト
      const res = await app.request('/tasks/task1/user/user123', {
        method: 'DELETE'
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(200);
      expect(data.message).toBe('Task deleted successfully');
      expect(mockTaskRepository.getTask).toHaveBeenCalledWith('user123', 'task1');
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith('user123', 'task1');
    });

    it('should return 404 when deleting non-existent task', async () => {
      // モックの設定
      mockTaskRepository.getTask.mockResolvedValue(null);

      // リクエスト
      const res = await app.request('/tasks/nonexistent/user/user123', {
        method: 'DELETE'
      });
      const data = await res.json();

      // 検証
      expect(res.status).toBe(404);
      expect(data.error).toBe('Task not found');
      expect(mockTaskRepository.deleteTask).not.toHaveBeenCalled();
    });
  });
});
