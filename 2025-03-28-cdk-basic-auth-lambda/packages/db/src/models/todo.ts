import { PutCommand, QueryCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, getTableName, getIndexName } from "../client";
import { randomUUID } from "node:crypto";

// Todo型の定義
export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// 新しいTodoを作成するための入力型
export interface CreateTodoInput {
  userId: string;
  title: string;
  completed?: boolean;
}

// Todoを更新するための入力型
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

// Todoを作成する関数
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const now = new Date().toISOString();
  const todo: Todo = {
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    completed: input.completed ?? false,
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(
    new PutCommand({
      TableName: getTableName(),
      Item: todo
    })
  );

  return todo;
}

// IDでTodoを取得する関数
export async function getTodoById(id: string): Promise<Todo | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: getTableName(),
      Key: { id }
    })
  );

  return result.Item as Todo | null;
}

// ユーザーIDに基づいてTodoを取得する関数
export async function getTodosByUserId(userId: string): Promise<Todo[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: getTableName(),
      IndexName: getIndexName(),
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })
  );

  return (result.Items || []) as Todo[];
}

// Todoを更新する関数
export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo | null> {
  // 更新するフィールドを動的に構築
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString()
  };
  
  if (input.title !== undefined) {
    updateExpressions.push("title = :title");
    expressionAttributeValues[":title"] = input.title;
  }
  
  if (input.completed !== undefined) {
    updateExpressions.push("completed = :completed");
    expressionAttributeValues[":completed"] = input.completed;
  }
  
  // 更新するフィールドがない場合は早期リターン
  if (updateExpressions.length === 0) {
    const todo = await getTodoById(id);
    return todo;
  }
  
  // 常に updatedAt を更新
  updateExpressions.push("updatedAt = :updatedAt");
  
  // 既存のTodoを取得して更新
  const existingTodo = await getTodoById(id);
  if (!existingTodo) {
    return null;
  }
  
  const result = await docClient.send(
    new PutCommand({
      TableName: getTableName(),
      Item: {
        ...existingTodo,
        ...(input.title !== undefined && { title: input.title }),
        ...(input.completed !== undefined && { completed: input.completed }),
        updatedAt: expressionAttributeValues[":updatedAt"] as string
      }
    })
  );
  
  return {
    ...existingTodo,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.completed !== undefined && { completed: input.completed }),
    updatedAt: expressionAttributeValues[":updatedAt"] as string
  };
}

// Todoを削除する関数
export async function deleteTodo(id: string): Promise<boolean> {
  const result = await docClient.send(
    new DeleteCommand({
      TableName: getTableName(),
      Key: { id },
      ReturnValues: "ALL_OLD"
    })
  );
  
  return !!result.Attributes;
}
