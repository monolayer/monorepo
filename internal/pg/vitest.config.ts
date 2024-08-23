import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	test: {
		name: "pg",
		coverage: {
			provider: "istanbul",
			reporter: ["html", "json"],
			exclude: ["**/tmp/**", "**/tests/**", "**/docs/**"],
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
