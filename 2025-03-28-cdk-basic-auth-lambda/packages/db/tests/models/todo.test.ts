import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	DynamoDBDocumentClient,
	PutCommand,
	GetCommand,
	QueryCommand,
	DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// Mock AWS SDK
vi.mock("@aws-sdk/client-dynamodb", () => {
	return {
		DynamoDBClient: vi.fn(() => ({
			send: vi.fn(),
		})),
	};
});

vi.mock("@aws-sdk/lib-dynamodb", () => {
	return {
		DynamoDBDocumentClient: {
			from: vi.fn(() => ({
				send: vi.fn(),
			})),
		},
		PutCommand: vi.fn(),
		GetCommand: vi.fn(),
		QueryCommand: vi.fn(),
		DeleteCommand: vi.fn(),
	};
});

// Mock randomUUID
vi.mock("node:crypto", () => {
	return {
		randomUUID: vi.fn(() => "mocked-uuid"),
	};
});

describe("Todo Model", () => {
	// Save original environment
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset mocks before each test
		vi.resetModules();
		vi.resetAllMocks();
		// Reset environment variables
		process.env = { ...originalEnv };
		// Set default environment
		process.env.ENV = "test";
	});

	afterEach(() => {
		// Restore environment variables
		process.env = originalEnv;
	});

	describe("createTodo", () => {
		it("should create a new todo with the provided input", async () => {
			// Mock the current date
			const mockDate = "2025-03-29T12:00:00.000Z";
			const dateSpy = vi
				.spyOn(Date.prototype, "toISOString")
				.mockReturnValue(mockDate);

			// Mock the send function to return a successful response
			const mockSend = vi.fn().mockResolvedValue({});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { createTodo } = await import("../../src/models/todo");

			// Call the function with test input
			const input = {
				userId: "user-123",
				title: "Test Todo",
				completed: false,
			};
			const result = await createTodo(input);

			// Check if PutCommand was called with the correct parameters
			expect(PutCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Item: {
					id: "mocked-uuid",
					userId: "user-123",
					title: "Test Todo",
					completed: false,
					createdAt: mockDate,
					updatedAt: mockDate,
				},
			});

			// Check if the function returned the correct todo
			expect(result).toEqual({
				id: "mocked-uuid",
				userId: "user-123",
				title: "Test Todo",
				completed: false,
				createdAt: mockDate,
				updatedAt: mockDate,
			});

			// Restore the date spy
			dateSpy.mockRestore();
		});

		it("should set completed to false by default if not provided", async () => {
			// Mock the current date
			const mockDate = "2025-03-29T12:00:00.000Z";
			const dateSpy = vi
				.spyOn(Date.prototype, "toISOString")
				.mockReturnValue(mockDate);

			// Mock the send function to return a successful response
			const mockSend = vi.fn().mockResolvedValue({});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { createTodo } = await import("../../src/models/todo");

			// Call the function with test input (without completed)
			const input = {
				userId: "user-123",
				title: "Test Todo",
			};
			const result = await createTodo(input);

			// Check if completed is set to false by default
			expect(result.completed).toBe(false);

			// Restore the date spy
			dateSpy.mockRestore();
		});
	});

	describe("getTodoById", () => {
		it("should return a todo when it exists", async () => {
			// Mock the todo item
			const mockTodo = {
				id: "todo-123",
				userId: "user-123",
				title: "Test Todo",
				completed: false,
				createdAt: "2025-03-29T12:00:00.000Z",
				updatedAt: "2025-03-29T12:00:00.000Z",
			};

			// Mock the send function to return the todo
			const mockSend = vi.fn().mockResolvedValue({
				Item: mockTodo,
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { getTodoById } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await getTodoById("todo-123");

			// Check if GetCommand was called with the correct parameters
			expect(GetCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Key: { id: "todo-123" },
			});

			// Check if the function returned the correct todo
			expect(result).toEqual(mockTodo);
		});

		it("should return null when the todo does not exist", async () => {
			// Mock the send function to return no item
			const mockSend = vi.fn().mockResolvedValue({
				Item: null,
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { getTodoById } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await getTodoById("non-existent-todo");

			// Check if the function returned null
			expect(result).toBeNull();
		});
	});

	describe("getTodosByUserId", () => {
		it("should return todos for a user", async () => {
			// Mock the todos
			const mockTodos = [
				{
					id: "todo-1",
					userId: "user-123",
					title: "Test Todo 1",
					completed: false,
					createdAt: "2025-03-29T12:00:00.000Z",
					updatedAt: "2025-03-29T12:00:00.000Z",
				},
				{
					id: "todo-2",
					userId: "user-123",
					title: "Test Todo 2",
					completed: true,
					createdAt: "2025-03-29T12:30:00.000Z",
					updatedAt: "2025-03-29T12:30:00.000Z",
				},
			];

			// Mock the send function to return the todos
			const mockSend = vi.fn().mockResolvedValue({
				Items: mockTodos,
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { getTodosByUserId } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await getTodosByUserId("user-123");

			// Check if QueryCommand was called with the correct parameters
			expect(QueryCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				IndexName: "CBAL-testUserIdIndex",
				KeyConditionExpression: "userId = :userId",
				ExpressionAttributeValues: {
					":userId": "user-123",
				},
			});

			// Check if the function returned the correct todos
			expect(result).toEqual(mockTodos);
		});

		it("should return an empty array when no todos exist for the user", async () => {
			// Mock the send function to return no items
			const mockSend = vi.fn().mockResolvedValue({
				Items: [],
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { getTodosByUserId } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await getTodosByUserId("user-with-no-todos");

			// Check if the function returned an empty array
			expect(result).toEqual([]);
		});
	});

	describe("updateTodo", () => {
		it("should update a todo with the provided input", async () => {
			// Mock the current date
			const mockDate = "2025-03-29T13:00:00.000Z";
			const dateSpy = vi
				.spyOn(Date.prototype, "toISOString")
				.mockReturnValue(mockDate);

			// Mock the existing todo
			const existingTodo = {
				id: "todo-123",
				userId: "user-123",
				title: "Original Title",
				completed: false,
				createdAt: "2025-03-29T12:00:00.000Z",
				updatedAt: "2025-03-29T12:00:00.000Z",
			};

			// Mock the send function to return the existing todo and then a successful update
			const mockSend = vi
				.fn()
				.mockResolvedValueOnce({ Item: existingTodo }) // First call for getTodoById
				.mockResolvedValueOnce({}); // Second call for PutCommand

			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { updateTodo } = await import("../../src/models/todo");

			// Call the function with test input
			const input = {
				title: "Updated Title",
				completed: true,
			};
			const result = await updateTodo("todo-123", input);

			// Check if GetCommand was called with the correct parameters
			expect(GetCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Key: { id: "todo-123" },
			});

			// Check if PutCommand was called with the correct parameters
			expect(PutCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Item: {
					...existingTodo,
					title: "Updated Title",
					completed: true,
					updatedAt: mockDate,
				},
			});

			// Check if the function returned the updated todo
			expect(result).toEqual({
				...existingTodo,
				title: "Updated Title",
				completed: true,
				updatedAt: mockDate,
			});

			// Restore the date spy
			dateSpy.mockRestore();
		});

		it("should return null when the todo does not exist", async () => {
			// Mock the send function to return no item
			const mockSend = vi.fn().mockResolvedValue({
				Item: null,
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { updateTodo } = await import("../../src/models/todo");

			// Call the function with test input
			const input = {
				title: "Updated Title",
			};
			const result = await updateTodo("non-existent-todo", input);

			// Check if the function returned null
			expect(result).toBeNull();
		});

		it("should only update the provided fields", async () => {
			// Mock the current date
			const mockDate = "2025-03-29T13:00:00.000Z";
			const dateSpy = vi
				.spyOn(Date.prototype, "toISOString")
				.mockReturnValue(mockDate);

			// Mock the existing todo
			const existingTodo = {
				id: "todo-123",
				userId: "user-123",
				title: "Original Title",
				completed: false,
				createdAt: "2025-03-29T12:00:00.000Z",
				updatedAt: "2025-03-29T12:00:00.000Z",
			};

			// Mock the send function to return the existing todo and then a successful update
			const mockSend = vi
				.fn()
				.mockResolvedValueOnce({ Item: existingTodo }) // First call for getTodoById
				.mockResolvedValueOnce({}); // Second call for PutCommand

			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { updateTodo } = await import("../../src/models/todo");

			// Call the function with only title update
			const input = {
				title: "Updated Title",
			};
			const result = await updateTodo("todo-123", input);

			// Check if PutCommand was called with only title updated
			expect(PutCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Item: {
					...existingTodo,
					title: "Updated Title",
					updatedAt: mockDate,
				},
			});

			// Check if the function returned the updated todo with original completed value
			expect(result).toEqual({
				...existingTodo,
				title: "Updated Title",
				completed: false, // Should remain unchanged
				updatedAt: mockDate,
			});

			// Restore the date spy
			dateSpy.mockRestore();
		});
	});

	describe("deleteTodo", () => {
		it("should delete a todo and return true when successful", async () => {
			// Mock the send function to return the deleted item
			const mockSend = vi.fn().mockResolvedValue({
				Attributes: { id: "todo-123" },
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { deleteTodo } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await deleteTodo("todo-123");

			// Check if DeleteCommand was called with the correct parameters
			expect(DeleteCommand).toHaveBeenCalledWith({
				TableName: "CBAL-testTodos",
				Key: { id: "todo-123" },
				ReturnValues: "ALL_OLD",
			});

			// Check if the function returned true
			expect(result).toBe(true);
		});

		it("should return false when the todo does not exist", async () => {
			// Mock the send function to return no attributes
			const mockSend = vi.fn().mockResolvedValue({
				Attributes: null,
			});
			vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
				send: mockSend,
			} as unknown as DynamoDBDocumentClient);

			// Import the module after mocking
			const { deleteTodo } = await import("../../src/models/todo");

			// Call the function with test input
			const result = await deleteTodo("non-existent-todo");

			// Check if the function returned false
			expect(result).toBe(false);
		});
	});
});
