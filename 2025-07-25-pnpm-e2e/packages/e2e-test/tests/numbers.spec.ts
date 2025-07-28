import { expect, test } from "@playwright/test";

test.describe("Numbers CRUD", () => {
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
		const timestamp = Date.now();
		const testName = `Test-${timestamp}`;
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
		await expect(
			page.locator('div[style*="background-color: #f8d7da"]'),
		).toBeVisible();
		await expect(page.locator("li")).toContainText("Name is required");

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");
	});

	test("should show validation errors when number is invalid", async ({
		page,
	}) => {
		// 新規作成画面に移動
		await page.goto("/numbers/new");

		// 名前を入力して、数値を無効な値にする
		await page.getByTestId("name-input").fill("Test Name");
		await page.getByTestId("number-input").fill("invalid");

		// 送信ボタンをクリック
		await page.getByTestId("submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(
			page.locator('div[style*="background-color: #f8d7da"]'),
		).toBeVisible();
		await expect(page.locator("li")).toContainText(
			"Number must be a valid integer",
		);

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");

		// 入力値が保持されることを確認
		await expect(page.getByTestId("name-input")).toHaveValue("Test Name");
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
			page.locator('div[style*="background-color: #f8d7da"]'),
		).toBeVisible();
		await expect(page.locator("li")).toContainText("Name is required");
		await expect(page.locator("li")).toContainText(
			"Number must be a valid integer",
		);

		// 新規作成画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Add New Number");
	});

	test("should edit an existing number successfully", async ({ page }) => {
		// 一覧画面に移動
		await page.goto("/");

		// 最初のデータの編集リンクをクリック（初期データの1番目のデータ: ID=1）
		await page.getByTestId("edit-link-1").click();

		// 編集画面に遷移することを確認
		await expect(page.locator("h2")).toContainText("Edit Number");

		// フォームの内容を変更
		const timestamp = Date.now();
		const newName = `Edited-${timestamp}`;
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
		// 編集画面に直接移動（初期データの1番目のデータ: ID=1）
		await page.goto("/numbers/1");

		// 名前を空にして送信
		await page.getByTestId("edit-name-input").fill("");
		await page.getByTestId("edit-submit-button").click();

		// エラーメッセージが表示されることを確認
		await expect(
			page.locator('div[style*="background-color: #f8d7da"]'),
		).toBeVisible();
		await expect(page.locator("li")).toContainText("Name is required");

		// 編集画面にとどまることを確認
		await expect(page.locator("h2")).toContainText("Edit Number");
	});

	test("should delete a number successfully", async ({ page }) => {
		// まず新しいデータを作成
		await page.goto("/numbers/new");
		const timestamp = Date.now();
		const testName = `ToDelete-${timestamp}`;
		await page.getByTestId("name-input").fill(testName);
		await page.getByTestId("number-input").fill("999");
		await page.getByTestId("submit-button").click();

		// 一覧画面で作成されたデータを確認
		await expect(page.locator("table tbody")).toContainText(testName);

		// 作成されたデータのIDを取得するため、テーブルから該当行を探す
		const row = page.locator("table tbody tr").filter({ hasText: testName });
		const idCell = row.locator("td").first();
		const id = await idCell.textContent();

		// 削除リンクをクリック
		await page.getByTestId(`delete-link-${id}`).click();

		// 削除確認画面に遷移することを確認
		await expect(page.locator("h2")).toContainText("Delete Number");
		await expect(page.locator("dd")).toContainText(testName);

		// 削除実行ボタンをクリック
		await page.getByTestId("confirm-delete-button").click();

		// 一覧画面に戻ることを確認
		await expect(page.locator("h2")).toContainText("Numbers List");

		// 削除されたデータが一覧から消えていることを確認
		await expect(page.locator("table tbody")).not.toContainText(testName);
	});
});
