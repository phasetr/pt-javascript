import axios, { type AxiosInstance } from "axios";
import { getConfig, updateApiUrl, getApiUrl } from "./config.js";

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
		// 初期設定でクライアントを作成（後で初期化時に更新）
		this.client = axios.create({
			baseURL: "http://localhost:3000", // 仮のベースURL（初期化時に更新）
			headers: {
				"Content-Type": "application/json",
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
			const config = await getConfig();

			// クライアントの設定を更新
			this.client.defaults.baseURL = apiUrl;
			this.client.defaults.auth = {
				username: config.auth.username,
				password: config.auth.password,
			};

			console.log(`API URL initialized: ${apiUrl}`);
			console.log(
				`Using auth credentials: ${config.auth.username}:${config.auth.password}`,
			);
			this.initialized = true;
		} catch (error) {
			console.warn("Failed to initialize API URL dynamically:", error);
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
		const config = await getConfig();

		// リクエストの設定
		const requestConfig = {
			auth: {
				username: config.auth.username,
				password: config.auth.password,
			},
		};

		console.log(
			`Using auth credentials for request: ${config.auth.username}:${config.auth.password}`,
		);

		try {
			// JSONデータを直接オブジェクトとして送信
			const todoData = {
				userId: todo.userId,
				title: todo.title,
				completed: todo.completed,
				...(todo.dueDate ? { dueDate: todo.dueDate } : {})
			};

			// 正しいJSONデータを手動で作成
			const validJsonData = `{"userId":"${todo.userId}","title":"${todo.title}","completed":${todo.completed}${todo.dueDate ? `,"dueDate":"${todo.dueDate}"` : ''}}`;
			console.log(`Using manually created JSON data: ${validJsonData}`);
			
			// Content-Typeヘッダーを明示的に設定
			const headers = {
				"Content-Type": "application/json",
			};

			// リクエスト設定にヘッダーを追加
			const configWithHeaders = {
				...requestConfig,
				headers,
			};

			const response = await this.client.post<CreateTodoResponse>(
				"/api/todos",
				validJsonData, // 手動で作成したJSON文字列を送信
				configWithHeaders,
			);
			return response.data;
		} catch (error) {
			console.error("Error creating todo:", error);
			throw error;
		}
	}

	// Get all Todos for a user
	async getTodosByUserId(userId: string): Promise<Todo[]> {
		await this.ensureInitialized();

		// 環境に応じた認証情報を取得
		const config = await getConfig();

		// Content-Typeヘッダーを明示的に設定
		const headers = {
			"Content-Type": "application/json",
		};

		// リクエストの設定
		const requestConfig = {
			auth: {
				username: config.auth.username,
				password: config.auth.password,
			},
			headers,
		};

		try {
			const response = await this.client.get<Todo[]>(
				`/api/todos/user/${userId}`,
				requestConfig,
			);
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
		const config = await getConfig();

		// Content-Typeヘッダーを明示的に設定
		const headers = {
			"Content-Type": "application/json",
		};

		// リクエストの設定
		const requestConfig = {
			auth: {
				username: config.auth.username,
				password: config.auth.password,
			},
			headers,
		};

		try {
			const response = await this.client.get<Todo>(
				`/api/todos/${id}`,
				requestConfig,
			);
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
		const config = await getConfig();

		// Content-Typeヘッダーを明示的に設定
		const headers = {
			"Content-Type": "application/json",
		};

		// リクエストの設定
		const requestConfig = {
			auth: {
				username: config.auth.username,
				password: config.auth.password,
			},
			headers,
		};

		try {
			// JSONデータを直接オブジェクトとして送信
			const todoData = {
				...(todo.title ? { title: todo.title } : {}),
				...(todo.completed !== undefined ? { completed: todo.completed } : {}),
				...(todo.dueDate ? { dueDate: todo.dueDate } : {})
			};

			// JSONデータをJSON文字列に変換
			const jsonData = JSON.stringify(todoData);
			console.log(`Sending JSON data for update: ${jsonData}`);

			const response = await this.client.put<Todo>(
				`/api/todos/${id}`,
				jsonData, // JSON文字列を送信
				requestConfig,
			);
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
		const config = await getConfig();

		// Content-Typeヘッダーを明示的に設定
		const headers = {
			"Content-Type": "application/json",
		};

		// リクエストの設定
		const requestConfig = {
			auth: {
				username: config.auth.username,
				password: config.auth.password,
			},
			headers,
			data: {}, // 空のデータを送信（DELETEリクエストの場合）
		};

		try {
			const response = await this.client.delete<DeleteTodoResponse>(
				`/api/todos/${id}`,
				requestConfig,
			);
			return response.data;
		} catch (error) {
			console.error(`Error deleting todo ${id}:`, error);
			throw error;
		}
	}
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
