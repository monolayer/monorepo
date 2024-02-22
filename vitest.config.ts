/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	test: {
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			exclude: ["**/tmp/**", "**/tests/**"],
		},
		setupFiles: ["tests/setup.ts"],
		reporters: ["verbose"],
		watchExclude: ["**/node_modules/**", "**/dist/**", "**/tmp/**"],
	},
	plugins: [tsconfigPaths()],
});
