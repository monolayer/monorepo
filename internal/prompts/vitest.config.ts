/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	test: {
		name: "prompts",
		coverage: {
			provider: "istanbul",
			reporter: ["html"],
			include: ["src/**/*.ts"],
			exclude: ["**/tmp/**/*", "**/tests/**", "**/docs/**"],
		},
		setupFiles: [],
		reporters: ["verbose"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
