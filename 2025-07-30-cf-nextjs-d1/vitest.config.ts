import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		exclude: ["**/node_modules/**", "**/dist/**", "**/*-itest/**"],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.test.ts",
				"**/*.spec.ts",
				"coverage/",
				"vitest.config.ts",
				"**/*.d.ts",
			],
		},
	},
	resolve: {
		alias: {
			core: resolve(__dirname, "./packages/core/src/index.ts"),
		},
	},
});
