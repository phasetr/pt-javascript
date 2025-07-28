import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test.describe("Numbers CRUD", () => {
	// 各テスト前にデータベースを完全リセット
	test.beforeEach(async () => {
		console.log("Resetting database before test...");
		try {
			// reset.sqlを実行してデータベースを初期状態にリセット
			// 環境に応じてパスを調整（Docker: /app, ローカル: プロジェクトルート）
			const isDocker =
				process.env.NODE_ENV === "test" && process.cwd().startsWith("/app");
			const webDir = isDocker ? "/app/packages/web" : "../web";
			const resetSqlPath = isDocker
				? "../e2e-test/reset.sql"
				: "../e2e-test/reset.sql";
			const wranglerCommand = isDocker ? "wrangler" : "pnpm wrangler";

			execSync(
				`${wranglerCommand} d1 execute ptdev --local --file=${resetSqlPath} --persist-to ../../.wrangler-persist`,
				{
					stdio: "pipe",
					cwd: webDir,
				},
			);
			console.log("Database reset completed");
		} catch (error) {
			console.error("Failed to reset database:", error);
			throw error;
		}
	});

	test("should create a new number successfully", async ({ page }) => {
		// 一覧画面に移動
		await page.goto("/");

		// 一覧画面が表示されることを確認
		await expect(page.locator("h2")).toContainText("Numbers List");

		// 新規作成ボタンをクリック
		await page.getByTestId("create-new-button").click();

		// 新規作成画面に遷移することを確認
		await expect(page.locator("h2")).toContainText("Add New Number");

		// フォームに入力
		const testName = `Test-${Date.now()}`;
		const testNumber = Math.floor(Math.random() * 1000);

		await page.getByTestId("name-input").fill(testName);
		await page.getByTestId("number-input").fill(testNumber.toString());

		// 送信ボタンをクリック
		await page.getByTestId("submit-button").click();

		// 一覧画面に戻ることを確認
		await expect(page.locator("h2")).toContainText("Numbers List");

		// 作成されたデータが一覧に表示されることを確認
		await expect(page.locator("table tbody")).toContainText(testName);
		await expect(page.locator("table tbody")).toContainText(
			testNumber.toString(),
		);
	});

	test("should show validation errors when name is empty", async ({ page }) => {
		// 新規作成画面に移動
		await page.goto("/numbers/new");

		// 名前を空にして、数値のみ入力
		await page.getByTestId("name-input").fill("");
		await page.getByTestId("number-input").fill("123");

		// 送信ボタンをクリック
		await page.getByTestId("submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(page.locator("li")).toContainText("Name is required");

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");
	});

	test("should show validation errors when number is invalid", async ({
		page,
	}) => {
		// 新規作成画面に移動
		await page.goto("/numbers/new");

		// 名前を入力して、数値フィールドを空にする
		await page.getByTestId("name-input").fill("Test Name");
		await page.getByTestId("number-input").fill("");

		// 送信ボタンをクリック
		await page.getByTestId("submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(page.locator("li")).toContainText(
			"Number must be a valid integer",
		);

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");
	});

	test("should show validation errors when both fields are invalid", async ({
		page,
	}) => {
		// 新規作成画面に移動
		await page.goto("/numbers/new");

		// 両方のフィールドを空にする
		await page.getByTestId("name-input").fill("");
		await page.getByTestId("number-input").fill("");

		// 送信ボタンをクリック
		await page.getByTestId("submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(
			page.locator("li").filter({ hasText: "Name is required" }),
		).toBeVisible();
		await expect(
			page.locator("li").filter({ hasText: "Number must be a valid integer" }),
		).toBeVisible();

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");
	});

	test("should edit an existing number successfully", async ({ page }) => {
		// 一覧画面に移動
		await page.goto("/");

		// 最初の行の編集リンクをクリック
		await page
			.locator("table tbody tr")
			.first()
			.locator("a")
			.filter({ hasText: "Edit" })
			.click();

		// 編集画面に遷移することを確認
		await expect(page.locator("h2")).toContainText("Edit Number");

		// フォームの内容を変更
		const newName = `Edited-${Date.now()}`;
		const newNumber = Math.floor(Math.random() * 1000);

		await page.getByTestId("edit-name-input").fill(newName);
		await page.getByTestId("edit-number-input").fill(newNumber.toString());

		// 更新ボタンをクリック
		await page.getByTestId("edit-submit-button").click();

		// 一覧画面に戻ることを確認
		await expect(page.locator("h2")).toContainText("Numbers List");

		// 更新されたデータが一覧に表示されることを確認
		await expect(page.locator("table tbody")).toContainText(newName);
		await expect(page.locator("table tbody")).toContainText(
			newNumber.toString(),
		);
	});

	test("should show validation errors when editing with invalid data", async ({
		page,
	}) => {
		// 一覧画面に移動
		await page.goto("/");

		// 最初の行の編集リンクをクリック
		await page
			.locator("table tbody tr")
			.first()
			.locator("a")
			.filter({ hasText: "Edit" })
			.click();

		// 名前を空にして送信
		await page.getByTestId("edit-name-input").fill("");
		await page.getByTestId("edit-submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(page.locator("li")).toContainText("Name is required");

		// 編集画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Edit Number");
	});

	test("should delete a number successfully", async ({ page }) => {
		// 一覧画面に移動
		await page.goto("/");

		// 最初の行の削除リンクをクリック
		await page
			.locator("table tbody tr")
			.first()
			.locator("a")
			.filter({ hasText: "Delete" })
			.click();

		// 削除確認画面に遷移することを確認
		await expect(page.locator("h2")).toContainText("Delete Number");

		// 削除実行ボタンをクリック
		await page.getByTestId("confirm-delete-button").click();

		// 一覧画面に戻ることを確認
		await expect(page.locator("h2")).toContainText("Numbers List");

		// データが削除されていることを確認（初期データは5件なので4件になる）
		await expect(page.locator("table tbody tr")).toHaveCount(4);
	});
});
