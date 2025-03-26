import { describe, it, expect, beforeEach } from 'vitest';
import { TaskRepository } from '../../src/repositories/task-repository';
import { createMockDynamoDBDocumentClient } from '../utils/dynamodb-mock-new';
import { createTaskPK, createTaskSK, TaskStatus } from '../../src/models/task';

describe('TaskRepository', () => {
  const TABLE_NAME = 'TestTasks';
  let taskRepository: TaskRepository;
  let mockStore: any;

  beforeEach(() => {
    const { client, store } = createMockDynamoDBDocumentClient();
    taskRepository = new TaskRepository(client, { tableName: TABLE_NAME });
    mockStore = store;
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      // Arrange
      const taskData = {
        userId: 'user123',
        taskId: 'task456',
        title: 'Test Task',
        description: 'This is a test task'
      };

      // Act
      const task = await taskRepository.createTask(taskData);

      // Assert
      expect(task).toBeDefined();
      expect(task.PK).toBe(createTaskPK(taskData.userId));
      expect(task.SK).toBe(createTaskSK(taskData.taskId));
      expect(task.userId).toBe(taskData.userId);
      expect(task.taskId).toBe(taskData.taskId);
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.status).toBe(TaskStatus.TODO);

      // Check if the task was stored in the mock database
      const key = `${task.PK}#${task.SK}`;
      expect(mockStore[TABLE_NAME][key]).toEqual(task);
    });

    it('should throw an error when creating a task that already exists', async () => {
      // Arrange
      const taskData = {
        userId: 'user123',
        taskId: 'task456',
        title: 'Test Task'
      };

      // Create the task first
      await taskRepository.createTask(taskData);

      // Act & Assert
      await expect(taskRepository.createTask(taskData)).rejects.toThrow();
    });
  });

  describe('getTask', () => {
    it('should return null for a non-existent task', async () => {
      // Act
      const task = await taskRepository.getTask('user123', 'nonexistent');

      // Assert
      expect(task).toBeNull();
    });

    it('should retrieve an existing task', async () => {
      // Arrange
      const taskData = {
        userId: 'user123',
        taskId: 'task456',
        title: 'Test Task',
        description: 'This is a test task'
      };
      await taskRepository.createTask(taskData);

      // Act
      const task = await taskRepository.getTask(taskData.userId, taskData.taskId);

      // Assert
      expect(task).toBeDefined();
      expect(task?.userId).toBe(taskData.userId);
      expect(task?.taskId).toBe(taskData.taskId);
      expect(task?.title).toBe(taskData.title);
      expect(task?.description).toBe(taskData.description);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      // Arrange
      const taskData = {
        userId: 'user123',
        taskId: 'task456',
        title: 'Old Title',
        description: 'Old Description'
      };
      await taskRepository.createTask(taskData);

      // Act
      const updatedTask = await taskRepository.updateTask(taskData.userId, taskData.taskId, {
        title: 'New Title',
        description: 'New Description',
        status: TaskStatus.IN_PROGRESS
      });

      // Assert
      expect(updatedTask.title).toBe('New Title');
      expect(updatedTask.description).toBe('New Description');
      expect(updatedTask.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask.userId).toBe(taskData.userId);
      expect(updatedTask.taskId).toBe(taskData.taskId);

      // Check if the task was updated in the mock database
      const key = `${updatedTask.PK}#${updatedTask.SK}`;
      expect(mockStore[TABLE_NAME][key]).toEqual(updatedTask);
    });

    it('should throw an error when updating a non-existent task', async () => {
      // Act & Assert
      await expect(taskRepository.updateTask('user123', 'nonexistent', {
        title: 'New Title'
      })).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      // Arrange
      const taskData = {
        userId: 'user123',
        taskId: 'task456',
        title: 'Test Task'
      };
      const task = await taskRepository.createTask(taskData);
      const key = `${task.PK}#${task.SK}`;

      // Verify the task exists in the mock database
      expect(mockStore[TABLE_NAME][key]).toBeDefined();

      // Act
      await taskRepository.deleteTask(taskData.userId, taskData.taskId);

      // Assert
      expect(mockStore[TABLE_NAME][key]).toBeUndefined();
    });

    it('should not throw an error when deleting a non-existent task', async () => {
      // Act & Assert
      await expect(taskRepository.deleteTask('user123', 'nonexistent')).resolves.not.toThrow();
    });
  });

  describe('listTasksByUser', () => {
    it('should return an empty array when user has no tasks', async () => {
      // Act
      const tasks = await taskRepository.listTasksByUser('user123');

      // Assert
      expect(tasks).toEqual([]);
    });

    it('should list all tasks for a user', async () => {
      // Arrange
      const userId = 'user123';
      const taskData1 = {
        userId,
        taskId: 'task1',
        title: 'Task 1'
      };
      const taskData2 = {
        userId,
        taskId: 'task2',
        title: 'Task 2'
      };

      await taskRepository.createTask(taskData1);
      await taskRepository.createTask(taskData2);

      // Act
      const tasks = await taskRepository.listTasksByUser(userId);

      // Assert
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.taskId)).toContain(taskData1.taskId);
      expect(tasks.map(t => t.taskId)).toContain(taskData2.taskId);
    });
  });

  describe('listTasksByStatus', () => {
    it('should return an empty array when no tasks match the status', async () => {
      // Act
      const tasks = await taskRepository.listTasksByStatus('user123', TaskStatus.DONE);

      // Assert
      expect(tasks).toEqual([]);
    });

    it('should list tasks filtered by status', async () => {
      // Arrange
      const userId = 'user123';
      
      // Create a TODO task
      const todoTask = await taskRepository.createTask({
        userId,
        taskId: 'task1',
        title: 'TODO Task'
      });
      
      // Create an IN_PROGRESS task
      const inProgressTask = await taskRepository.createTask({
        userId,
        taskId: 'task2',
        title: 'In Progress Task'
      });
      await taskRepository.updateTask(userId, inProgressTask.taskId, {
        status: TaskStatus.IN_PROGRESS
      });
      
      // Create a DONE task
      const doneTask = await taskRepository.createTask({
        userId,
        taskId: 'task3',
        title: 'Done Task'
      });
      await taskRepository.updateTask(userId, doneTask.taskId, {
        status: TaskStatus.DONE
      });

      // Act - Get TODO tasks
      const todoTasks = await taskRepository.listTasksByStatus(userId, TaskStatus.TODO);
      
      // Assert
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].taskId).toBe('task1');
      expect(todoTasks[0].status).toBe(TaskStatus.TODO);
      
      // Act - Get IN_PROGRESS tasks
      const inProgressTasks = await taskRepository.listTasksByStatus(userId, TaskStatus.IN_PROGRESS);
      
      // Assert
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].taskId).toBe('task2');
      expect(inProgressTasks[0].status).toBe(TaskStatus.IN_PROGRESS);
      
      // Act - Get DONE tasks
      const doneTasks = await taskRepository.listTasksByStatus(userId, TaskStatus.DONE);
      
      // Assert
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].taskId).toBe('task3');
      expect(doneTasks[0].status).toBe(TaskStatus.DONE);
    });
  });
});
