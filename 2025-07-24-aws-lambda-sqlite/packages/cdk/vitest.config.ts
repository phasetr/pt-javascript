import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		pool: "forks",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"coverage/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/bin/**",
			],
		},
	},
});
