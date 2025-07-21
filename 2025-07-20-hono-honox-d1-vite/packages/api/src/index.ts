import { users } from "db";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});

app.get("/users", async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

export default app;
