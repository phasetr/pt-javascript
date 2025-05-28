import { Hono } from 'hono'
import { PrismaClient } from 'db'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Prismaクライアントの初期化（D1データベースを使用）
const createPrismaClient = (db: D1Database) => {
  return new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db' // D1の場合は実際のD1インスタンスを使用
      }
    }
  })
}

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hono API with Prisma</title>
      </head>
      <body>
        <h1>Hono API with Prisma</h1>
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
    const prisma = createPrismaClient(c.env.DB)
    const users = await prisma.user.findMany()
    return c.json(users)
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

    const prisma = createPrismaClient(c.env.DB)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null
      }
    })
    
    return c.json(user, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// ユーザー詳細取得
app.get('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const prisma = createPrismaClient(c.env.DB)
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})

export default app
