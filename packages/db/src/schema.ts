import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  PK: text("PK").primaryKey(),
  SK: text("SK").notNull(),
  entity: text("entity").notNull().default("USER"),
  id: text("id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const posts = sqliteTable("posts", {
  PK: text("PK").primaryKey(),
  SK: text("SK").notNull(),
  entity: text("entity").notNull().default("POST"),
  id: text("id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
