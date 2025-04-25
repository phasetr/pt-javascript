import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Customersテーブルの定義
export const customers = sqliteTable("Customers", {
  CustomerId: integer("CustomerId").primaryKey(),
  CompanyName: text("CompanyName").notNull(),
  ContactName: text("ContactName").notNull(),
});

// 型定義のエクスポート
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
