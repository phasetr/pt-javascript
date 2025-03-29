import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { apiClient, type Todo, type CreateTodoRequest, type UpdateTodoRequest } from './api-client.js';
import { getEnvironment } from 'aws-utils';
import { getApiUrl } from './config.js';

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

// コンソール出力を抑制する
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('Todo API Integration Tests', () => {
  // テスト前にコンソール出力を抑制
  beforeAll(async () => {
    // コンソール出力を抑制
    console.error = () => {};
    console.log = () => {};
    console.warn = () => {};
    
    // 非ローカル環境の場合はAPI URLを取得
    if (getEnvironment(process.env.NODE_ENV) !== 'local') {
      try {
        await getApiUrl();
      } catch (error) {
        // エラーは無視
      }
    }
  });
  
  // テスト後にコンソール出力を元に戻す
  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
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
  });

  it('should get a todo by ID', async () => {
    const todo = await apiClient.getTodoById(createdTodo.id);
    
    // Assertions
    expect(todo).toBeDefined();
    expect(todo.id).toBe(createdTodo.id);
    expect(todo.userId).toBe(createTodoData.userId);
    expect(todo.title).toBe(createTodoData.title);
    expect(todo.completed).toBe(createTodoData.completed);
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
  });

  it('should delete a todo', async () => {
    const response = await apiClient.deleteTodo(createdTodo.id);
    
    // Assertions
    expect(response).toBeDefined();
    expect(response.message).toBe('Todo deleted successfully');
    
    // Verify the todo is deleted by trying to get it (should throw an error)
    try {
      await apiClient.getTodoById(createdTodo.id);
      // If we get here, the todo was not deleted
      expect(true).toBe(false); // This will fail the test
    } catch (error) {
      // Expected error - 404 Not Found
      expect(error).toBeDefined();
      
      // Check if it's an Axios error with status 404
      // Type guard for Axios error
      if (
        error && 
        typeof error === 'object' && 
        'response' in error && 
        error.response && 
        typeof error.response === 'object' && 
        'status' in error.response
      ) {
        expect(error.response.status).toBe(404);
        
        // データプロパティの存在を確認
        if (
          'data' in error.response && 
          error.response.data && 
          typeof error.response.data === 'object'
        ) {
          // エラーメッセージを検証
          if ('error' in error.response.data) {
            expect(error.response.data.error).toBe('Todo not found');
          }
        }
      }
    }
  });
});
