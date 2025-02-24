import { Dockerfile } from "@monolayer/dw";
import { baseStageNode20Alpine320 } from "./base.js";

export function generateCronsDockerfile(crons: { id: string; file: string }[]) {
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

	dockerfile.RUN("echo '' > crons-runner.ts");
	dockerfile.RUN(
		"echo 'export async function runCron(id: any) {' >> crons-runner.ts",
	);
	dockerfile.RUN(
		"echo 'const imports: Record<string, any> = {}' >> crons-runner.ts",
	);
	crons.forEach((cron) => {
		dockerfile.RUN(
			`echo 'imports["${cron.id}"] = await import("${cron.file.replace(".ts", ".js")}");' >> crons-runner.ts`,
		);
	});
	dockerfile.RUN("echo 'await imports[id].default.run();' >> crons-runner.ts");
	dockerfile.RUN("echo '}' >> crons-runner.ts");
	dockerfile.RUN(
		"echo 'runCron(process.argv[2]).catch((e) => console.error(e));' >> crons-runner.ts",
	);

	dockerfile.RUN(
		`echo -e 'import { defineConfig } from "tsup";${tsupConfig()}' > tsup.config.ts`,
	);

	dockerfile.RUN("npx tsup");

	dockerfile.ENTRYPOINT("node", ["dist/bin/crons-runner.cjs"]);
	return dockerfile;
}

function tsupConfig() {
	return `export default defineConfig({ \
	format: ["cjs"], \
	entry: ["./crons-runner.ts"], \
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
