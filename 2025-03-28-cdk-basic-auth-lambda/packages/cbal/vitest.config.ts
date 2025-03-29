import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		testTimeout: 10000, // Reduced timeout to 10 seconds
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
		},
	},
});
