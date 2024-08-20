/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	test: {
		name: "programs",
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			exclude: ["**/tmp/**", "**/tests/**", "**/docs/**"],
		},
		setupFiles: ["__test_setup__/setup.ts"],
		reporters: ["default"],
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});

export default config;