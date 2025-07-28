import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { numbers } from "../db/index.js";

/**
 * numbersテーブルのselect型
 */
export type NumbersSelect = InferSelectModel<typeof numbers>;

/**
 * numbersテーブルのinsert型
 */
export type NumbersInsert = InferInsertModel<typeof numbers>;
