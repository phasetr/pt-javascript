import { describe, it, expect, beforeEach } from "vitest";
import { UserRepository } from "../../src/repositories/user-repository";
import { createMockDynamoDBDocumentClient } from "../utils/dynamodb-mock";
import { createUserPK, USER_SK, USER_ENTITY } from "../../src/models/user";

describe("UserRepository", () => {
	const TABLE_NAME = "TestUsers";
	let userRepository: UserRepository;
	let mockStore: Record<string, Record<string, any>>;

	beforeEach(() => {
		const { client, store } = createMockDynamoDBDocumentClient();
		userRepository = new UserRepository(client, { tableName: TABLE_NAME });
		mockStore = store;
	});

	describe("createUser", () => {
		it("should create a user successfully", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "test@example.com",
				name: "Test User",
			};

			// Act
			const user = await userRepository.createUser(userData);

			// Assert
			expect(user).toBeDefined();
			expect(user.PK).toBe(createUserPK(userData.id));
			expect(user.SK).toBe(USER_SK);
			expect(user.id).toBe(userData.id);
			expect(user.email).toBe(userData.email);
			expect(user.name).toBe(userData.name);

			// Check if the user was stored in the mock database
			const key = `${user.PK}#${user.SK}`;
			expect(mockStore[TABLE_NAME][key]).toEqual(user);
		});

		it("should throw an error when creating a user that already exists", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "test@example.com",
				name: "Test User",
			};

			// Create the user first
			await userRepository.createUser(userData);

			// Act & Assert
			await expect(userRepository.createUser(userData)).rejects.toThrow();
		});
	});

	describe("getUser", () => {
		it("should return null for a non-existent user", async () => {
			// Act
			const user = await userRepository.getUser("nonexistent");

			// Assert
			expect(user).toBeNull();
		});

		it("should retrieve an existing user", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "test@example.com",
				name: "Test User",
			};
			await userRepository.createUser(userData);

			// Act
			const user = await userRepository.getUser(userData.id);

			// Assert
			expect(user).toBeDefined();
			expect(user?.id).toBe(userData.id);
			expect(user?.email).toBe(userData.email);
			expect(user?.name).toBe(userData.name);
		});
	});

	describe("updateUser", () => {
		it("should update an existing user", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "old@example.com",
				name: "Old Name",
			};
			await userRepository.createUser(userData);

			// Act
			const updatedUser = await userRepository.updateUser(userData.id, {
				email: "new@example.com",
				name: "New Name",
			});

			// Assert
			expect(updatedUser.email).toBe("new@example.com");
			expect(updatedUser.name).toBe("New Name");
			expect(updatedUser.id).toBe(userData.id);

			// Check if the user was updated in the mock database
			const key = `${updatedUser.PK}#${updatedUser.SK}`;
			expect(mockStore[TABLE_NAME][key]).toEqual(updatedUser);
		});

		it("should throw an error when updating a non-existent user", async () => {
			// Act & Assert
			await expect(
				userRepository.updateUser("nonexistent", {
					name: "New Name",
				}),
			).rejects.toThrow("User not found");
		});
	});

	describe("deleteUser", () => {
		it("should delete an existing user", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "test@example.com",
				name: "Test User",
			};
			const user = await userRepository.createUser(userData);
			const key = `${user.PK}#${user.SK}`;

			// Verify the user exists in the mock database
			expect(mockStore[TABLE_NAME][key]).toBeDefined();

			// Act
			await userRepository.deleteUser(userData.id);

			// Assert
			expect(mockStore[TABLE_NAME][key]).toBeUndefined();
		});

		it("should not throw an error when deleting a non-existent user", async () => {
			// Act & Assert
			await expect(
				userRepository.deleteUser("nonexistent"),
			).resolves.not.toThrow();
		});
	});

	describe("getUserByEmail", () => {
		it("should return null for a non-existent email", async () => {
			// Act
			const user = await userRepository.getUserByEmail(
				"nonexistent@example.com",
			);

			// Assert
			expect(user).toBeNull();
		});

		it("should retrieve a user by email", async () => {
			// Arrange
			const userData = {
				id: "user123",
				email: "test@example.com",
				name: "Test User",
			};
			await userRepository.createUser(userData);

			// Act
			const user = await userRepository.getUserByEmail(userData.email);

			// Assert
			expect(user).toBeDefined();
			expect(user?.id).toBe(userData.id);
			expect(user?.email).toBe(userData.email);
		});
	});

	describe("listAllUsers", () => {
		it("should return an empty array when no users exist", async () => {
			// Act
			const result = await userRepository.listAllUsers();

			// Assert
			expect(result.users).toEqual([]);
			expect(result.lastEvaluatedKey).toBeUndefined();
		});

		it("should return all users", async () => {
			// Arrange
			const userDataList = [
				{
					id: "user1",
					email: "user1@example.com",
					name: "User One",
				},
				{
					id: "user2",
					email: "user2@example.com",
					name: "User Two",
				},
				{
					id: "user3",
					email: "user3@example.com",
					name: "User Three",
				},
			];

			// Create users
			for (const userData of userDataList) {
				await userRepository.createUser(userData);
			}

			// Mock the GSI query response
			mockStore.EntityIndex = {};
			for (const key in mockStore[TABLE_NAME]) {
				const user = mockStore[TABLE_NAME][key] as any;
				if (typeof user === 'object' && user !== null && 'entity' in user && user.entity === USER_ENTITY) {
					mockStore.EntityIndex[`${user.entity}#${user.id}`] = user;
				}
			}

			// Act
			const result = await userRepository.listAllUsers();

			// Assert
			expect(result.users).toHaveLength(3);
			expect(result.users.map((user) => user.id).sort()).toEqual([
				"user1",
				"user2",
				"user3",
			]);

			// Verify each user has the entity field set to USER_ENTITY
			for (const user of result.users) {
				expect(user.entity).toBe(USER_ENTITY);
			}
		});

		it("should respect the limit parameter", async () => {
			// Arrange
			const userDataList = [
				{
					id: "user1",
					email: "user1@example.com",
					name: "User One",
				},
				{
					id: "user2",
					email: "user2@example.com",
					name: "User Two",
				},
				{
					id: "user3",
					email: "user3@example.com",
					name: "User Three",
				},
			];

			// Create users
			for (const userData of userDataList) {
				await userRepository.createUser(userData);
			}

			// Mock the GSI query response
			mockStore.EntityIndex = {};
			for (const key in mockStore[TABLE_NAME]) {
				const user = mockStore[TABLE_NAME][key] as any;
				if (typeof user === 'object' && user !== null && 'entity' in user && user.entity === USER_ENTITY) {
					mockStore.EntityIndex[`${user.entity}#${user.id}`] = user;
				}
			}

			// Act
			const result = await userRepository.listAllUsers(2);

			// Assert
			expect(result.users).toHaveLength(2);
			expect(result.lastEvaluatedKey).toBeDefined();
		});
	});
});
