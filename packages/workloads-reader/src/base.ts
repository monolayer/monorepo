import { Dockerfile } from "@monolayer/dw";

export function baseStageNode20Alpine320(opts: { as: string }) {
	return new Dockerfile()
		.banner("Base image stage")
		.FROM("public.ecr.aws/docker/library/node:20-alpine3.20", { as: opts.as })
		.comment(
			"Add libc6-compat package (shared library required for use of process.dlopen).",
		)
		.comment(
			"See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine",
		)
		.RUN("apk add --no-cache gcompat=1.1.0-r4")
		.blank();
}
