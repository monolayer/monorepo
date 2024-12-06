import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "dw",
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
