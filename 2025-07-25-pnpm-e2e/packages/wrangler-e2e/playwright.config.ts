import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests",
	/* テストを順次実行（データベースリセット方式のため） */
	fullyParallel: false,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: 0,
	/* 順次実行のためワーカー数を1に固定 */
	workers: 1,
	/* 各テストのタイムアウト設定 */
	timeout: 60000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "list",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8787",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Timeout for each test */
		actionTimeout: 30000,
		navigationTimeout: 30000,
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				headless: true,
			},
		},

		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				headless: true,
			},
		},

		{
			name: "webkit",
			use: {
				...devices["Desktop Safari"],
				headless: true,
			},
		},

		/* Test against mobile view ports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	// webServer: {
	//   command: 'npm run start',
	//   url: 'http://127.0.0.1:8787',
	//   reuseExistingServer: !process.env.CI,
	// },
});
