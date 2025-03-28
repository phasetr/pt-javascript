import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidv4 } from "uuid";

// カスタムZodスキーマ for YYYY-MM-DD形式の日付
const dateSchema = z.string().refine(
	(val) => {
		return /^\d{4}-\d{2}-\d{2}$/.test(val) && !Number.isNaN(Date.parse(val));
	},
	{
		message: "Invalid date format. Use YYYY-MM-DD",
	},
);

// Zodスキーマの定義
const TodoSchema = z.object({
	userId: z.string().min(1),
	title: z.string().min(1).max(100),
	completed: z.boolean(),
	dueDate: dateSchema.optional(),
});

const TodoUpdateSchema = TodoSchema.partial().omit({ userId: true });

// 現在のUTC時刻を取得する関数
const getCurrentTimestamp = () => new Date().toISOString();

// インメモリストレージ（ローカルテスト用）
const todoStore: Record<string, any> = {};
const todosByUser: Record<string, string[]> = {};

const todos = new Hono()
	.post("/", zValidator("json", TodoSchema), async (c) => {
		const validatedData = c.req.valid("json");
		const now = getCurrentTimestamp();
		const todoId = uuidv4();
		
		const newTodo = {
			id: todoId,
			...validatedData,
			createdAt: now,
			updatedAt: now,
		};
		
		// インメモリストレージに保存
		todoStore[todoId] = newTodo;
		
		// ユーザーIDでのインデックスを更新
		if (!todosByUser[validatedData.userId]) {
			todosByUser[validatedData.userId] = [];
		}
		todosByUser[validatedData.userId].push(todoId);
		
		return c.json(
			{ message: "Todo created successfully", todo: newTodo },
			201,
		);
	})
	.get("/user/:userId", async (c) => {
		const userId = c.req.param("userId");
		
		// ユーザーのTodoを取得
		const todoIds = todosByUser[userId] || [];
		const todos = todoIds.map(id => todoStore[id]).filter(Boolean);
		
		return c.json(todos);
	})
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		
		// Todoを取得
		const todo = todoStore[id];
		if (todo) {
			return c.json(todo);
		}
		
		return c.json({ error: "Todo not found" }, 404);
	})
	.put("/:id", zValidator("json", TodoUpdateSchema), async (c) => {
		const id = c.req.param("id");
		const validatedData = c.req.valid("json");
		
		// Todoを取得
		const todo = todoStore[id];
		if (!todo) {
			return c.json({ error: "Todo not found" }, 404);
		}
		
		// Todoを更新
		const updatedTodo = {
			...todo,
			...validatedData,
			updatedAt: getCurrentTimestamp(),
		};
		
		// インメモリストレージを更新
		todoStore[id] = updatedTodo;
		
		return c.json(updatedTodo);
	})
	.delete("/:id", async (c) => {
		const id = c.req.param("id");
		
		// Todoを取得
		const todo = todoStore[id];
		if (!todo) {
			return c.json({ error: "Todo not found" }, 404);
		}
		
		// ユーザーIDでのインデックスを更新
		if (todosByUser[todo.userId]) {
			todosByUser[todo.userId] = todosByUser[todo.userId].filter(todoId => todoId !== id);
		}
		
		// インメモリストレージから削除
		delete todoStore[id];
		
		return c.json({ message: "Todo deleted successfully" });
	});

export { todos };
