import { describe, it, expect } from "vitest";
import {
	type Task,
	createTask,
	updateTask,
	createTaskPK,
	createTaskSK,
	TaskStatus,
} from "../../src/models/task";

describe("Task Model", () => {
	it("should create a task with correct PK and SK", () => {
		const userId = "user123";
		const taskId = "task456";
		const title = "Test Task";
		const description = "This is a test task";

		const task = createTask({ userId, taskId, title, description });

		expect(task.PK).toBe(`USER#${userId}`);
		expect(task.SK).toBe(`TASK#${taskId}`);
		expect(task.userId).toBe(userId);
		expect(task.taskId).toBe(taskId);
		expect(task.title).toBe(title);
		expect(task.description).toBe(description);
		expect(task.status).toBe(TaskStatus.TODO);
		expect(task.createdAt).toBeDefined();
		expect(task.updatedAt).toBeDefined();
		expect(task.createdAt).toBe(task.updatedAt);
	});

	it("should create task PK and SK with correct format", () => {
		const userId = "user123";
		const taskId = "task456";

		const pk = createTaskPK(userId);
		const sk = createTaskSK(taskId);

		expect(pk).toBe(`USER#${userId}`);
		expect(sk).toBe(`TASK#${taskId}`);
	});

	it("should update a task correctly", async () => {
		// Arrange
		const now = new Date().toISOString();
		const task: Task = {
			PK: "USER#user123",
			SK: "TASK#task456",
			userId: "user123",
			taskId: "task456",
			title: "Old Title",
			description: "Old Description",
			status: TaskStatus.TODO,
			createdAt: now,
			updatedAt: now,
		};

		// 更新前に少し待機して時間差を作る
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Act
		const updatedTask = updateTask(task, {
			title: "New Title",
			description: "New Description",
			status: TaskStatus.IN_PROGRESS,
		});

		// Assert
		expect(updatedTask.PK).toBe(task.PK);
		expect(updatedTask.SK).toBe(task.SK);
		expect(updatedTask.userId).toBe(task.userId);
		expect(updatedTask.taskId).toBe(task.taskId);
		expect(updatedTask.title).toBe("New Title");
		expect(updatedTask.description).toBe("New Description");
		expect(updatedTask.status).toBe(TaskStatus.IN_PROGRESS);
		expect(updatedTask.createdAt).toBe(task.createdAt);
		expect(updatedTask.updatedAt).not.toBe(task.updatedAt);
	});

	it("should handle optional fields correctly", () => {
		const userId = "user123";
		const taskId = "task456";
		const title = "Test Task";

		// Create task without optional fields
		const task = createTask({ userId, taskId, title });

		expect(task.description).toBeUndefined();
		expect(task.dueDate).toBeUndefined();
		expect(task.title).toBe(title);
		expect(task.status).toBe(TaskStatus.TODO);
	});

	it("should handle due date correctly", () => {
		const userId = "user123";
		const taskId = "task456";
		const title = "Test Task";
		const dueDate = "2025-12-31T23:59:59Z";

		// Create task with due date
		const task = createTask({ userId, taskId, title, dueDate });

		expect(task.dueDate).toBe(dueDate);
	});
});
