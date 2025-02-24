import { Dockerfile } from "@monolayer/dw";

export function generateTasksDockerfile(files: string[]) {
	const dockerfile = new Dockerfile();
	dockerfile.comment("syntax=docker.io/docker/dockerfile:1");
	dockerfile.blank();

	dockerfile.append(baseStageNode20Alpine320({ as: "base" }));
	dockerfile.banner("Dependencies");
	dockerfile.WORKDIR("/app");
	dockerfile.RUN("npm install -g tsup");
	dockerfile.COPY(["."], "./");
	dockerfile.RUN([
		"if [ -f yarn.lock ]; then yarn --frozen-lockfile;",
		"elif [ -f package-lock.json ]; then npm ci;",
		"elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i;",
		'else echo "Lockfile not found." && exit 1;',
		"fi",
	]);

	dockerfile.RUN("echo '' > tasks-runner.ts");
	dockerfile.RUN(
		"echo 'import { TaskWorker } from \"./node_modules/@monolayer/workloads/dist/esm/workloads/stateless/task/worker.js\";' >> task-runner.ts",
	);
	files.forEach((f, idx) => {
		dockerfile.RUN(
			`echo 'import task${idx} from "${f.replace(".ts", ".js")}";' >> task-runner.ts`,
		);
	});

	dockerfile.RUN(
		`echo 'new TaskWorker([${files.map((_, idx) => `task${idx}`).join(",")}]);' >> task-runner.ts`,
	);

	dockerfile.RUN(
		`echo -e 'import { defineConfig } from "tsup";${tsupConfig()}' > tsup.config.ts`,
	);

	dockerfile.RUN("npx tsup");

	dockerfile.ENTRYPOINT("node", ["dist/bin/task-runner.cjs"]);
	return dockerfile;
}

export function baseStageNode20Alpine320(opts: { as: string }) {
	return new Dockerfile()
		.banner("Base image stage")
		.FROM("node:20-alpine3.20", { as: opts.as })
		.comment(
			"Add libc6-compat package (shared library required for use of process.dlopen).",
		)
		.comment(
			"See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine",
		)
		.RUN("apk add --no-cache gcompat=1.1.0-r4")
		.blank();
}

function tsupConfig() {
	return `export default defineConfig({ \
	format: ["cjs"], \
	entry: ["./task-runner.ts"], \
	outDir: "dist/bin", \
	dts: false, \
	shims: true, \
	skipNodeModulesBundle: true, \
	clean: true, \
	target: "node20", \
	platform: "node", \
	minify: false, \
	bundle: true, \
	noExternal: [/(.*)/], \
	splitting: false, \
	cjsInterop: false, \
	treeshake: true, \
	sourcemap: true, \
});`;
}
