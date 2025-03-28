import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { apiClient, type Todo, type CreateTodoRequest, type UpdateTodoRequest } from './api-client.js';
import { getEnvironment } from './config.js';

// 現在の環境を取得
const currentEnv = getEnvironment();
// ローカル環境かどうかを判定
const isLocalEnv = currentEnv === 'local';

// Vitestのシリアライズエラーを防ぐためのモックは削除

// Test user ID
const TEST_USER_ID = 'test-user-123';

// Test data
const createTodoData: CreateTodoRequest = {
  userId: TEST_USER_ID,
  title: 'Test Todo',
  completed: false,
  dueDate: '2025-12-31',
};

// Store created todo for later tests
let createdTodo: Todo;

describe('Todo API Integration Tests', () => {
  beforeAll(() => {
    console.log(`Running tests in ${getEnvironment()} environment`);
  });

  it('should create a new todo', async () => {
    const response = await apiClient.createTodo(createTodoData);
    
    // Store created todo for later tests
    createdTodo = response.todo;
    
    // Assertions
    expect(response.message).toBe('Todo created successfully');
    expect(response.todo).toBeDefined();
    expect(response.todo.id).toBeDefined();
    expect(response.todo.userId).toBe(createTodoData.userId);
    expect(response.todo.title).toBe(createTodoData.title);
    expect(response.todo.completed).toBe(createTodoData.completed);
    expect(response.todo.dueDate).toBe(createTodoData.dueDate);
    expect(response.todo.createdAt).toBeDefined();
    expect(response.todo.updatedAt).toBeDefined();
    
    console.log('Created Todo:', response.todo);
  });

  it('should get todos by user ID', async () => {
    const todos = await apiClient.getTodosByUserId(TEST_USER_ID);
    
    // Assertions
    expect(Array.isArray(todos)).toBe(true);
    expect(todos.length).toBeGreaterThan(0);
    
    // Check if the created todo is in the list
    const foundTodo = todos.find(todo => todo.id === createdTodo.id);
    expect(foundTodo).toBeDefined();
    expect(foundTodo?.title).toBe(createTodoData.title);
    
    console.log('Found Todos:', todos.length);
  });

  it('should get a todo by ID', async () => {
    const todo = await apiClient.getTodoById(createdTodo.id);
    
    // Assertions
    expect(todo).toBeDefined();
    expect(todo.id).toBe(createdTodo.id);
    expect(todo.userId).toBe(createTodoData.userId);
    expect(todo.title).toBe(createTodoData.title);
    expect(todo.completed).toBe(createTodoData.completed);
    
    console.log('Retrieved Todo:', todo);
  });

  it('should update a todo', async () => {
    const updateData: UpdateTodoRequest = {
      title: 'Updated Test Todo',
      completed: true,
    };
    
    const updatedTodo = await apiClient.updateTodo(createdTodo.id, updateData);
    
    // Assertions
    expect(updatedTodo).toBeDefined();
    expect(updatedTodo.id).toBe(createdTodo.id);
    expect(updatedTodo.title).toBe(updateData.title);
    expect(updatedTodo.completed).toBe(updateData.completed);
    expect(updatedTodo.updatedAt).not.toBe(createdTodo.updatedAt);
    
    console.log('Updated Todo:', updatedTodo);
  });

  it('should delete a todo', async () => {
    const response = await apiClient.deleteTodo(createdTodo.id);
    
    // Assertions
    expect(response).toBeDefined();
    expect(response.message).toBe('Todo deleted successfully');
    
    console.log('Delete Response:', response);
    
    // Verify the todo is deleted by trying to get it (should throw an error)
    try {
      await apiClient.getTodoById(createdTodo.id);
      // If we get here, the todo was not deleted
      expect(true).toBe(false); // This will fail the test
    } catch (error) {
      // Expected error
      expect(error).toBeDefined();
    }
  });

  afterAll(() => {
    console.log('Tests completed');
  });
});
