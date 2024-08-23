import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "monolayer",
		pool: "forks",
		poolOptions: {
			forks: {
				minForks: 1,
				maxForks: 3,
			},
		},
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			exclude: ["**/tmp/**", "**/tests/**", "**/docs/**"],
		},
		setupFiles: ["tests/__setup__/setup.ts"],
		reporters: ["verbose"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
