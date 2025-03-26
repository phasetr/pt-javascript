/**
 * タスクエンドポイント
 * 
 * タスクに関するAPIエンドポイントを提供します。
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { taskRepository } from '../db';
import { TaskStatus } from '@ctld/db-lib';
import { v4 as uuidv4 } from 'uuid';

// タスクルーター
export const taskRouter = new Hono();

// タスク作成スキーマ
const createTaskSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional()
});

// タスク更新スキーマ
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).optional(),
  dueDate: z.string().optional()
});

// ユーザーのタスク一覧を取得
taskRouter.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const tasks = await taskRepository.listTasksByUser(userId);
    
    return c.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

// ユーザーのタスクをステータスでフィルタリング
taskRouter.get('/user/:userId/status/:status', async (c) => {
  try {
    const userId = c.req.param('userId');
    const statusParam = c.req.param('status');
    
    // ステータスパラメータを検証
    if (!Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      return c.json({ error: 'Invalid status parameter' }, 400);
    }
    
    const status = statusParam as TaskStatus;
    const tasks = await taskRepository.listTasksByStatus(userId, status);
    
    return c.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    return c.json({ error: 'Failed to fetch tasks by status' }, 500);
  }
});

// 特定のタスクを取得
taskRouter.get('/:taskId/user/:userId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const userId = c.req.param('userId');
    
    const task = await taskRepository.getTask(userId, taskId);
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    return c.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return c.json({ error: 'Failed to fetch task' }, 500);
  }
});

// タスクを作成
taskRouter.post('/', zValidator('json', createTaskSchema), async (c) => {
  try {
    const { userId, title, description, dueDate } = c.req.valid('json');
    
    // タスクIDを生成
    const taskId = uuidv4();
    
    // タスクを作成
    const task = await taskRepository.createTask({
      userId,
      taskId,
      title,
      description,
      dueDate
    });
    
    return c.json(task, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

// タスクを更新
taskRouter.put('/:taskId/user/:userId', zValidator('json', updateTaskSchema), async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const userId = c.req.param('userId');
    const updates = c.req.valid('json');
    
    // タスクが存在するか確認
    const existingTask = await taskRepository.getTask(userId, taskId);
    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    // タスクを更新
    const updatedTask = await taskRepository.updateTask(userId, taskId, updates);
    
    return c.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

// タスクを削除
taskRouter.delete('/:taskId/user/:userId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const userId = c.req.param('userId');
    
    // タスクが存在するか確認
    const existingTask = await taskRepository.getTask(userId, taskId);
    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    // タスクを削除
    await taskRepository.deleteTask(userId, taskId);
    
    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});
