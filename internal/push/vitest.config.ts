import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "push",
		setupFiles: ["test/__setup__/setup.ts"],
		pool: "forks",
		poolOptions: {
			forks: {
				minForks: 1,
				maxForks: 5,
			},
		},
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
