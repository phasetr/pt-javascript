import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getConfig } from './config.js';

// Todo type definition
export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Create Todo request type
export interface CreateTodoRequest {
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

// Update Todo request type
export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
  dueDate?: string;
}

// Create Todo response type
export interface CreateTodoResponse {
  message: string;
  todo: Todo;
}

// Delete Todo response type
export interface DeleteTodoResponse {
  message: string;
}

// API client class
export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const config = getConfig();
    
    // Create axios instance with base URL and auth
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Create a new Todo
  async createTodo(todo: CreateTodoRequest): Promise<CreateTodoResponse> {
    const response = await this.client.post<CreateTodoResponse>('/api/todos', todo);
    return response.data;
  }

  // Get all Todos for a user
  async getTodosByUserId(userId: string): Promise<Todo[]> {
    const response = await this.client.get<Todo[]>(`/api/todos/user/${userId}`);
    return response.data;
  }

  // Get a Todo by ID
  async getTodoById(id: string): Promise<Todo> {
    const response = await this.client.get<Todo>(`/api/todos/${id}`);
    return response.data;
  }

  // Update a Todo
  async updateTodo(id: string, todo: UpdateTodoRequest): Promise<Todo> {
    const response = await this.client.put<Todo>(`/api/todos/${id}`, todo);
    return response.data;
  }

  // Delete a Todo
  async deleteTodo(id: string): Promise<DeleteTodoResponse> {
    const response = await this.client.delete<DeleteTodoResponse>(`/api/todos/${id}`);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
