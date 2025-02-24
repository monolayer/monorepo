import { validate } from "@monolayer/dw";
import { assert, expect, test } from "vitest";
import { generateCronsDockerfile } from "./dockerfile-crons.js";

test("Dockerfile", () => {
	const dockerfile = generateCronsDockerfile([
		{ id: "reports", file: "./lib/workloads/reports.ts" },
		{ id: "second-report", file: "./lib/workloads/second-report.ts" },
	]);
	expect(dockerfile.toString()).toStrictEqual(`\
# syntax=docker.io/docker/dockerfile:1

# ---------
# Base image stage
# ---------

FROM node:20-alpine3.20 AS base

# Add libc6-compat package (shared library required for use of process.dlopen).
# See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine
RUN apk add --no-cache gcompat=1.1.0-r4


# ---------
# Dependencies
# ---------

WORKDIR /app

RUN npm install -g tsup

COPY . ./

RUN <<EOF
if [ -f yarn.lock ]; then yarn --frozen-lockfile;
elif [ -f package-lock.json ]; then npm ci;
elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i;
else echo "Lockfile not found." && exit 1;
fi
EOF

RUN echo '' > crons-runner.ts

RUN echo 'export async function runCron(id: any) {' >> crons-runner.ts

RUN echo 'const imports: Record<string, any> = {}' >> crons-runner.ts

RUN echo 'imports["reports"] = await import("./lib/workloads/reports.js");' >> crons-runner.ts

RUN echo 'imports["second-report"] = await import("./lib/workloads/second-report.js");' >> crons-runner.ts

RUN echo 'await imports[id].default.run();' >> crons-runner.ts

RUN echo '}' >> crons-runner.ts

RUN echo 'runCron(process.argv[2]).catch((e) => console.error(e));' >> crons-runner.ts

RUN echo -e 'import { defineConfig } from "tsup";export default defineConfig({ 	format: ["cjs"], 	entry: ["./crons-runner.ts"], 	outDir: "dist/bin", 	dts: false, 	shims: true, 	skipNodeModulesBundle: true, 	clean: true, 	target: "node20", 	platform: "node", 	minify: false, 	bundle: true, 	noExternal: [/(.*)/], 	splitting: false, 	cjsInterop: false, 	treeshake: true, 	sourcemap: true, });' > tsup.config.ts

RUN npx tsup

ENTRYPOINT ["node", "dist/bin/crons-runner.cjs"]
`);
	assert.isTrue(validate(dockerfile));
});
