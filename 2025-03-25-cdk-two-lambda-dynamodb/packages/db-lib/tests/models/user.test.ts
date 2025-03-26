import { describe, it, expect } from "vitest";
import {
	type User,
	createUser,
	updateUser,
	createUserPK,
	USER_SK,
} from "../../src/models/user";

describe("User Model", () => {
	it("should create a user with correct PK and SK", () => {
		const userId = "user123";
		const email = "test@example.com";
		const name = "Test User";

		const user = createUser({ userId, email, name });

		expect(user.PK).toBe(`USER#${userId}`);
		expect(user.SK).toBe(USER_SK);
		expect(user.userId).toBe(userId);
		expect(user.email).toBe(email);
		expect(user.name).toBe(name);
		expect(user.createdAt).toBeDefined();
		expect(user.updatedAt).toBeDefined();
		expect(user.createdAt).toBe(user.updatedAt);
	});

	it("should create a user PK with correct format", () => {
		const userId = "user123";
		const pk = createUserPK(userId);
		expect(pk).toBe(`USER#${userId}`);
	});

	it("should update a user correctly", async () => {
		// Arrange
		const now = new Date().toISOString();
		const user: User = {
			PK: "USER#user123",
			SK: USER_SK,
			userId: "user123",
			email: "old@example.com",
			name: "Old Name",
			createdAt: now,
			updatedAt: now,
		};

		// 更新前に少し待機して時間差を作る
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Act
		const updatedUser = updateUser(user, {
			email: "new@example.com",
			name: "New Name",
		});

		// Assert
		expect(updatedUser.PK).toBe(user.PK);
		expect(updatedUser.SK).toBe(user.SK);
		expect(updatedUser.userId).toBe(user.userId);
		expect(updatedUser.email).toBe("new@example.com");
		expect(updatedUser.name).toBe("New Name");
		expect(updatedUser.createdAt).toBe(user.createdAt);
		expect(updatedUser.updatedAt).not.toBe(user.updatedAt);
	});
});
