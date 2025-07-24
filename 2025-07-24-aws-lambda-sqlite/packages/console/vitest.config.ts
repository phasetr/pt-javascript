/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		pool: "threads",
		poolOptions: {
			threads: {
				minThreads: 1,
				maxThreads: 1,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/test/**",
			],
			thresholds: {
				global: {
					branches: 100,
					functions: 100,
					lines: 100,
					statements: 100,
				},
			},
		},
	},
});
