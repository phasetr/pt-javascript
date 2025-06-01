import { Hono } from 'hono'
import { createD1Db, users } from '../../db/src'
import { eq } from 'drizzle-orm'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()


app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hono API with Drizzle</title>
      </head>
      <body>
        <h1>Hono API with Drizzle</h1>
        <p>API endpoints:</p>
        <ul>
          <li><a href="/api/users">GET /api/users</a> - Get all users</li>
          <li>POST /api/users - Create a new user</li>
          <li>GET /api/users/:id - Get user by ID</li>
        </ul>
      </body>
    </html>
  `)
})

// ユーザー一覧取得
app.get('/api/users', async (c) => {
  try {
    const db = createD1Db(c.env.DB)
    const result = await db.select().from(users)
    return c.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// ユーザー作成
app.post('/api/users', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name } = body
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const db = createD1Db(c.env.DB)
    const result = await db.insert(users).values({
      email,
      name: name || null
    }).returning()
    
    return c.json(result[0], 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// ユーザー詳細取得
app.get('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = createD1Db(c.env.DB)
    const result = await db.select().from(users).where(eq(users.id, id))
    
    if (result.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(result[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})

export default app
