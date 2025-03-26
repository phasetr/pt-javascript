import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from '../../src/repositories/user-repository';
import { createMockDynamoDBDocumentClient } from '../utils/dynamodb-mock';
import { createUserPK, USER_SK } from '../../src/models/user';

describe('UserRepository', () => {
  const TABLE_NAME = 'TestUsers';
  let userRepository: UserRepository;
  let mockStore: any;

  beforeEach(() => {
    const { client, store } = createMockDynamoDBDocumentClient();
    userRepository = new UserRepository(client, { tableName: TABLE_NAME });
    mockStore = store;
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Act
      const user = await userRepository.createUser(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.PK).toBe(createUserPK(userData.userId));
      expect(user.SK).toBe(USER_SK);
      expect(user.userId).toBe(userData.userId);
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);

      // Check if the user was stored in the mock database
      const key = `${user.PK}#${user.SK}`;
      expect(mockStore[TABLE_NAME][key]).toEqual(user);
    });

    it('should throw an error when creating a user that already exists', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Create the user first
      await userRepository.createUser(userData);

      // Act & Assert
      await expect(userRepository.createUser(userData)).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should return null for a non-existent user', async () => {
      // Act
      const user = await userRepository.getUser('nonexistent');

      // Assert
      expect(user).toBeNull();
    });

    it('should retrieve an existing user', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };
      await userRepository.createUser(userData);

      // Act
      const user = await userRepository.getUser(userData.userId);

      // Assert
      expect(user).toBeDefined();
      expect(user?.userId).toBe(userData.userId);
      expect(user?.email).toBe(userData.email);
      expect(user?.name).toBe(userData.name);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'old@example.com',
        name: 'Old Name'
      };
      await userRepository.createUser(userData);

      // Act
      const updatedUser = await userRepository.updateUser(userData.userId, {
        email: 'new@example.com',
        name: 'New Name'
      });

      // Assert
      expect(updatedUser.email).toBe('new@example.com');
      expect(updatedUser.name).toBe('New Name');
      expect(updatedUser.userId).toBe(userData.userId);

      // Check if the user was updated in the mock database
      const key = `${updatedUser.PK}#${updatedUser.SK}`;
      expect(mockStore[TABLE_NAME][key]).toEqual(updatedUser);
    });

    it('should throw an error when updating a non-existent user', async () => {
      // Act & Assert
      await expect(userRepository.updateUser('nonexistent', {
        name: 'New Name'
      })).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };
      const user = await userRepository.createUser(userData);
      const key = `${user.PK}#${user.SK}`;

      // Verify the user exists in the mock database
      expect(mockStore[TABLE_NAME][key]).toBeDefined();

      // Act
      await userRepository.deleteUser(userData.userId);

      // Assert
      expect(mockStore[TABLE_NAME][key]).toBeUndefined();
    });

    it('should not throw an error when deleting a non-existent user', async () => {
      // Act & Assert
      await expect(userRepository.deleteUser('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    it('should return null for a non-existent email', async () => {
      // Act
      const user = await userRepository.getUserByEmail('nonexistent@example.com');

      // Assert
      expect(user).toBeNull();
    });

    it('should retrieve a user by email', async () => {
      // Arrange
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };
      await userRepository.createUser(userData);

      // Act
      const user = await userRepository.getUserByEmail(userData.email);

      // Assert
      expect(user).toBeDefined();
      expect(user?.userId).toBe(userData.userId);
      expect(user?.email).toBe(userData.email);
    });
  });
});
