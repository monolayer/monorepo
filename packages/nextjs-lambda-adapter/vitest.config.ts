import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "nextjs-lambda-adapter",
	},
	server: {
		watch: {
			ignored: ["**/node_modules/**", "**/dist/**", "**/tmp/**", "**/docs/**"],
		},
	},
	plugins: [tsconfigPaths()],
});
