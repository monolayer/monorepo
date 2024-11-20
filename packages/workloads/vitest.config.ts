import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "sidecar",
		setupFiles: ["test/__setup__/setup.ts"],
		pool: "forks",
		minWorkers: 1,
		maxWorkers: 2,
		fileParallelism: false,
		testTimeout: 10000,
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
