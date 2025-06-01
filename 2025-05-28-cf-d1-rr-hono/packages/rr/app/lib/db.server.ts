import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { users } from '../../../db/src/schema';
import { eq } from 'drizzle-orm';

export { users };

export function getDb(env: Env): DrizzleD1Database {
  return drizzle(env.DB);
}

export async function getAllUsers(env: Env) {
  const db = getDb(env);
  return await db.select().from(users);
}

export async function getUserById(env: Env, id: string) {
  const db = getDb(env);
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function createUser(env: Env, data: { email: string; name?: string | null }) {
  const db = getDb(env);
  const result = await db.insert(users).values({
    email: data.email,
    name: data.name || null,
  }).returning();
  return result[0];
}

export async function updateUser(env: Env, id: string, data: { email?: string; name?: string | null }) {
  const db = getDb(env);
  const result = await db.update(users)
    .set({
      ...(data.email !== undefined && { email: data.email }),
      ...(data.name !== undefined && { name: data.name }),
    })
    .where(eq(users.id, id))
    .returning();
  return result[0] || null;
}

export async function deleteUser(env: Env, id: string) {
  const db = getDb(env);
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result[0] || null;
}