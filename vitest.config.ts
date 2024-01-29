/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	test: {
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
		},
		setupFiles: ["tests/setup.ts"],
		reporters: ["verbose"],
		watchExclude: ["**/node_modules/**", "**/dist/**", "**/tmp/**"],
	},
	plugins: [tsconfigPaths()],
});
