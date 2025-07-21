import { createRoute } from 'honox/factory'
import { drizzle } from 'drizzle-orm/d1'
import { users } from 'db'
import type { Bindings } from '../global'

export default createRoute<{ Bindings: Bindings }>(async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const allUsers = await db.select().from(users)

    return c.render(
      <div>
        <h1 class="text-3xl font-bold underline">Users</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
      { title: 'User List' }
    )
  } catch (error) {
    return c.render(<div>
      <h1 class="text-3xl font-bold underline text-blue-700">Users</h1>
      <h2 class="text-red-600">Error</h2>
      <p>We have encountered an error while fetching users.</p>
      <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>)
  }
})
