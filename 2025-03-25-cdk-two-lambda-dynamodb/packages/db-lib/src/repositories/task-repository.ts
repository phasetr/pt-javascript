/**
 * タスクリポジトリ
 *
 * DynamoDBのタスクテーブルに対する操作を提供します。
 */

import {
	type DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	DeleteCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	type Task,
	createTaskPK,
	createTaskSK,
	createTask,
	updateTask,
	type TaskStatus,
	TASK_ENTITY,
} from "../models/task.js";

export interface TaskRepositoryConfig {
	tableName: string;
}

export class TaskRepository {
	private readonly client: DynamoDBDocumentClient;
	private readonly tableName: string;

	constructor(client: DynamoDBDocumentClient, config: TaskRepositoryConfig) {
		this.client = client;
		this.tableName = config.tableName;
	}

	/**
	 * タスクを取得
	 */
	async getTask(userId: string, id: string): Promise<Task | null> {
		const command = new GetCommand({
			TableName: this.tableName,
			Key: {
				PK: createTaskPK(userId),
				SK: createTaskSK(id),
			},
		});

		const response = await this.client.send(command);
		return response.Item as Task | null;
	}

	/**
	 * タスクを作成
	 */
	async createTask(task: Task | {
		userId: string;
		id: string;
		title: string;
		description?: string;
		dueDate?: string;
	}): Promise<Task> {
		// タスクオブジェクトを作成
		const taskItem = 'PK' in task ? task : createTask(task);

		const command = new PutCommand({
			TableName: this.tableName,
			Item: taskItem,
			ConditionExpression:
				"attribute_not_exists(PK) AND attribute_not_exists(SK)",
		});

		await this.client.send(command);
		return taskItem;
	}

	/**
	 * タスクを更新
	 */
	async updateTask(
		userId: string,
		id: string,
		updates: Partial<
			Omit<Task, "PK" | "SK" | "userId" | "id" | "entity" | "createdAt">
		>,
	): Promise<Task> {
		const task = await this.getTask(userId, id);
		if (!task) {
			throw new Error(`Task not found: ${id} for user ${userId}`);
		}

		const updatedTask = updateTask(task, updates);

		const command = new PutCommand({
			TableName: this.tableName,
			Item: updatedTask,
		});

		await this.client.send(command);
		return updatedTask;
	}

	/**
	 * タスクを削除
	 */
	async deleteTask(userId: string, id: string): Promise<void> {
		const command = new DeleteCommand({
			TableName: this.tableName,
			Key: {
				PK: createTaskPK(userId),
				SK: createTaskSK(id),
			},
		});

		await this.client.send(command);
	}

	/**
	 * ユーザーのタスク一覧を取得
	 */
	async listTasksByUser(userId: string): Promise<Task[]> {
		const command = new QueryCommand({
			TableName: this.tableName,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk_prefix)",
			ExpressionAttributeValues: {
				":pk": createTaskPK(userId),
				":sk_prefix": "TASK#",
			},
		});

		const response = await this.client.send(command);
		return (response.Items || []) as Task[];
	}

	/**
	 * ステータスでタスクをフィルタリング
	 */
	async listTasksByStatus(userId: string, status: TaskStatus): Promise<Task[]> {
		const command = new QueryCommand({
			TableName: this.tableName,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk_prefix)",
			FilterExpression: "#status = :status",
			ExpressionAttributeNames: {
				"#status": "status",
			},
			ExpressionAttributeValues: {
				":pk": createTaskPK(userId),
				":sk_prefix": "TASK#",
				":status": status,
			},
		});

		const response = await this.client.send(command);
		return (response.Items || []) as Task[];
	}

	/**
	 * 全てのタスクを取得
	 * 
	 * 注: このメソッドはGSI（EntityIndex）を使用して、entityがTASKのアイテムを取得します。
	 * 
	 * @param limit 取得する最大件数（デフォルト: 100）
	 * @param lastEvaluatedKey 前回のレスポンスから取得した続きのキー
	 * @returns タスクの配列と続きのキー
	 */
	async listAllTasks(limit = 100, lastEvaluatedKey?: Record<string, unknown>): Promise<{
		tasks: Task[];
		lastEvaluatedKey?: Record<string, unknown>;
	}> {
		// デバッグ情報を出力
		console.log(`Querying EntityIndex with entity=${TASK_ENTITY} and limit: ${limit}`);
		console.log(`Last evaluated key: ${JSON.stringify(lastEvaluatedKey)}`);
		
		// クエリコマンドを作成
		const command = new QueryCommand({
			TableName: this.tableName,
			IndexName: "EntityIndex",
			KeyConditionExpression: "entity = :entity",
			ExpressionAttributeValues: {
				":entity": TASK_ENTITY
			},
			Limit: limit,
			ExclusiveStartKey: lastEvaluatedKey
		});

		// クエリを実行
		const response = await this.client.send(command);
		
		// デバッグ情報を出力
		console.log(`Found ${response.Items?.length || 0} items`);
		console.log(`Last evaluated key: ${JSON.stringify(response.LastEvaluatedKey)}`);
		
		// 結果を返す
		return {
			tasks: (response.Items || []) as Task[],
			lastEvaluatedKey: response.LastEvaluatedKey
		};
	}
}
