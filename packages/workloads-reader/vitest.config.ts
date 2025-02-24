import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "workloads-reader",
		pool: "forks",
		minWorkers: 1,
		maxWorkers: 1,
		fileParallelism: false,
		testTimeout: 20000,
		env: {
			// DEBUG: "testcontainers",
		},
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
