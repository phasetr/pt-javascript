/**
 * タスクモデル
 * 
 * DynamoDBのタスクテーブルに対応するモデル定義
 */

export interface Task {
  PK: string; // パーティションキー: USER#<userId>
  SK: string; // ソートキー: TASK#<taskId>
  userId: string;
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

/**
 * ユーザーIDからパーティションキーを生成
 */
export function createTaskPK(userId: string): string {
  return `USER#${userId}`;
}

/**
 * タスクIDからソートキーを生成
 */
export function createTaskSK(taskId: string): string {
  return `TASK#${taskId}`;
}

/**
 * タスクオブジェクトを作成
 */
export function createTask(params: {
  userId: string;
  taskId: string;
  title: string;
  description?: string;
  dueDate?: string;
}): Task {
  const now = new Date().toISOString();
  
  return {
    PK: createTaskPK(params.userId),
    SK: createTaskSK(params.taskId),
    userId: params.userId,
    taskId: params.taskId,
    title: params.title,
    description: params.description,
    status: TaskStatus.TODO,
    dueDate: params.dueDate,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * タスクオブジェクトを更新
 */
export function updateTask(task: Task, updates: Partial<Omit<Task, 'PK' | 'SK' | 'userId' | 'taskId' | 'createdAt'>>): Task {
  // 現在時刻を取得（テスト用に引数で渡せるようにする）
  const now = new Date().toISOString();
  
  return {
    ...task,
    ...updates,
    updatedAt: now
  };
}
