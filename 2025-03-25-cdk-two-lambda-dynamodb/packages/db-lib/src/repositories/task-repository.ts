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
} from "../models/task";

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
	async getTask(userId: string, taskId: string): Promise<Task | null> {
		const command = new GetCommand({
			TableName: this.tableName,
			Key: {
				PK: createTaskPK(userId),
				SK: createTaskSK(taskId),
			},
		});

		const response = await this.client.send(command);
		return response.Item as Task | null;
	}

	/**
	 * タスクを作成
	 */
	async createTask(params: {
		userId: string;
		taskId: string;
		title: string;
		description?: string;
		dueDate?: string;
	}): Promise<Task> {
		const task = createTask(params);

		const command = new PutCommand({
			TableName: this.tableName,
			Item: task,
			ConditionExpression:
				"attribute_not_exists(PK) AND attribute_not_exists(SK)",
		});

		await this.client.send(command);
		return task;
	}

	/**
	 * タスクを更新
	 */
	async updateTask(
		userId: string,
		taskId: string,
		updates: Partial<
			Omit<Task, "PK" | "SK" | "userId" | "taskId" | "createdAt">
		>,
	): Promise<Task> {
		const task = await this.getTask(userId, taskId);
		if (!task) {
			throw new Error(`Task not found: ${taskId} for user ${userId}`);
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
	async deleteTask(userId: string, taskId: string): Promise<void> {
		const command = new DeleteCommand({
			TableName: this.tableName,
			Key: {
				PK: createTaskPK(userId),
				SK: createTaskSK(taskId),
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
}
