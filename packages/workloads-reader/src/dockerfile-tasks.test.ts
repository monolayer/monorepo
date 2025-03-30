import { validate } from "@monolayer/dw";
import { assert, expect, test } from "vitest";
import { generateTasksDockerfile } from "~workloads-reader/dockerfile-tasks.js";

test("Dockerfile", () => {
	const dockerfile = generateTasksDockerfile([
		"./lib/workloads/reports.ts",
		"./lib/workloads/second-report.ts",
	]);
	expect(dockerfile.toString()).toStrictEqual(`\
# syntax=docker.io/docker/dockerfile:1

# ---------
# Base image stage
# ---------

FROM public.ecr.aws/docker/library/node:20-alpine3.20 AS base

# Add libc6-compat package (shared library required for use of process.dlopen).
# See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine
RUN apk add --no-cache gcompat=1.1.0-r4


# ---------
# Dependencies
# ---------

WORKDIR /app

RUN npm install -g tsup

COPY . ./

RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

RUN echo '' > tasks-runner.ts

RUN echo 'import { TaskWorker } from "./node_modules/@monolayer/workloads/dist/esm/workloads/stateless/task/worker.js";' >> task-runner.ts

RUN echo 'import task0 from "./lib/workloads/reports.js";' >> task-runner.ts

RUN echo 'import task1 from "./lib/workloads/second-report.js";' >> task-runner.ts

RUN echo 'new TaskWorker([task0,task1]);' >> task-runner.ts

RUN echo -e 'import { defineConfig } from "tsup";export default defineConfig({ 	format: ["cjs"], 	entry: ["./task-runner.ts"], 	outDir: "dist/bin", 	dts: false, 	shims: true, 	skipNodeModulesBundle: true, 	clean: true, 	target: "node20", 	platform: "node", 	minify: false, 	bundle: true, 	noExternal: [/(.*)/], 	splitting: false, 	cjsInterop: false, 	treeshake: true, 	sourcemap: true, });' > tsup.config.ts

RUN npx tsup

ENTRYPOINT ["node", "dist/ml-lambda/task-runner.cjs"]
`);
	assert.isTrue(validate(dockerfile));
});
