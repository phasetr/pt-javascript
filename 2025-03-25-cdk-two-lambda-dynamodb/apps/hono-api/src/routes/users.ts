/**
 * ユーザーエンドポイント
 * 
 * ユーザーに関するAPIエンドポイントを提供します。
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { userRepository } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

// ユーザールーター
export const userRouter = new Hono();

// ユーザー作成スキーマ
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});

// ユーザー更新スキーマ
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional()
});

// ユーザー一覧を取得（実際のアプリケーションでは、認証・認可が必要）
userRouter.get('/', async (c) => {
  try {
    // クエリパラメータからlimitとlastEvaluatedKeyを取得
    const limitParam = c.req.query('limit');
    const lastEvaluatedKeyParam = c.req.query('lastEvaluatedKey');
    
    // limitをパース（デフォルト: 100）
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;
    
    // lastEvaluatedKeyをパース
    const lastEvaluatedKey = lastEvaluatedKeyParam ? JSON.parse(lastEvaluatedKeyParam) : undefined;
    
    // 全てのユーザーを取得
    const result = await userRepository.listAllUsers(limit, lastEvaluatedKey);
    
    return c.json({
      users: result.users,
      lastEvaluatedKey: result.lastEvaluatedKey,
      limit,
      count: result.users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// ユーザーを取得
userRouter.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await userRepository.getUser(userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ユーザーを作成
userRouter.post('/', zValidator('json', createUserSchema), async (c) => {
  try {
    const { email, name } = c.req.valid('json');
    
    // UUIDを生成
    const userId = uuidv4();
    
    // ユーザーを作成
    const user = await userRepository.createUser({
      id: userId,
      email,
      name
    } as any);
    
    return c.json(user, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// ユーザーを更新
userRouter.put('/:userId', zValidator('json', updateUserSchema), async (c) => {
  try {
    const userId = c.req.param('userId');
    const updates = c.req.valid('json');
    
    // ユーザーが存在するか確認
    const existingUser = await userRepository.getUser(userId);
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // ユーザーを更新
    const updatedUser = await userRepository.updateUser(userId, updates);
    
    return c.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ユーザーを削除
userRouter.delete('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // ユーザーが存在するか確認
    const existingUser = await userRepository.getUser(userId);
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // ユーザーを削除
    await userRepository.deleteUser(userId);
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// メールアドレスでユーザーを検索
userRouter.get('/email/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const user = await userRepository.getUserByEmail(email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return c.json({ error: 'Failed to fetch user by email' }, 500);
  }
});
