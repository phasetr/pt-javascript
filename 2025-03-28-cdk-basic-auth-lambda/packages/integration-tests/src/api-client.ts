import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getConfig, updateApiUrl } from './config.js';
import { getApiUrl } from './aws-utils.js';

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
  private initialized = false;

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

  /**
   * APIクライアントを初期化する
   * AWS環境の場合はAPI URLを動的に取得する
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // API URLを取得
      const apiUrl = await getApiUrl();
      
      // 設定を更新
      updateApiUrl(apiUrl);
      
      // 環境に応じた認証情報を取得
      const config = getConfig();
      
      // クライアントの設定を更新
      this.client.defaults.baseURL = apiUrl;
      this.client.defaults.auth = {
        username: config.auth.username,
        password: config.auth.password,
      };
      
      console.log(`API URL initialized: ${apiUrl}`);
      console.log(`Using auth credentials: ${config.auth.username}:${config.auth.password}`);
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize API URL dynamically:', error);
      // エラーが発生した場合は初期化済みとしてマーク
      this.initialized = true;
    }
  }

  /**
   * リクエストを実行する前に初期化を確認する
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Create a new Todo
  async createTodo(todo: CreateTodoRequest): Promise<CreateTodoResponse> {
    await this.ensureInitialized();
    
    // 環境に応じた認証情報を取得
    const config = getConfig();
    
    // リクエストの設定
    const requestConfig = {
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
    };
    
    console.log(`Using auth credentials for request: ${config.auth.username}:${config.auth.password}`);
    
    try {
      const response = await this.client.post<CreateTodoResponse>('/api/todos', todo, requestConfig);
      return response.data;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  }

  // Get all Todos for a user
  async getTodosByUserId(userId: string): Promise<Todo[]> {
    await this.ensureInitialized();
    
    // 環境に応じた認証情報を取得
    const config = getConfig();
    
    // リクエストの設定
    const requestConfig = {
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
    };
    
    try {
      const response = await this.client.get<Todo[]>(`/api/todos/user/${userId}`, requestConfig);
      return response.data;
    } catch (error) {
      console.error(`Error getting todos for user ${userId}:`, error);
      throw error;
    }
  }

  // Get a Todo by ID
  async getTodoById(id: string): Promise<Todo> {
    await this.ensureInitialized();
    
    // 環境に応じた認証情報を取得
    const config = getConfig();
    
    // リクエストの設定
    const requestConfig = {
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
    };
    
    try {
      const response = await this.client.get<Todo>(`/api/todos/${id}`, requestConfig);
      return response.data;
    } catch (error) {
      console.error(`Error getting todo ${id}:`, error);
      throw error;
    }
  }

  // Update a Todo
  async updateTodo(id: string, todo: UpdateTodoRequest): Promise<Todo> {
    await this.ensureInitialized();
    
    // 環境に応じた認証情報を取得
    const config = getConfig();
    
    // リクエストの設定
    const requestConfig = {
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
    };
    
    try {
      const response = await this.client.put<Todo>(`/api/todos/${id}`, todo, requestConfig);
      return response.data;
    } catch (error) {
      console.error(`Error updating todo ${id}:`, error);
      throw error;
    }
  }

  // Delete a Todo
  async deleteTodo(id: string): Promise<DeleteTodoResponse> {
    await this.ensureInitialized();
    
    // 環境に応じた認証情報を取得
    const config = getConfig();
    
    // リクエストの設定
    const requestConfig = {
      auth: {
        username: config.auth.username,
        password: config.auth.password,
      },
    };
    
    try {
      const response = await this.client.delete<DeleteTodoResponse>(`/api/todos/${id}`, requestConfig);
      return response.data;
    } catch (error) {
      console.error(`Error deleting todo ${id}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
