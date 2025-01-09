import { Dockerfile } from "@monolayer/dw";

const dockerSyntax = new Dockerfile().comment("syntax=docker.io/docker/dockerfile:1").blank();

const libc6CompatPackage = new Dockerfile()
	.comment("Add libc6-compat package (shared library required for use of process.dlopen).")
	.comment("See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine")
	.RUN("apk add --no-cache gcompat=1.1.0-r4")
	.blank();

export function baseStageNode22Alpine320(opts: { as: string }) {
	return new Dockerfile()
		.append(dockerSyntax)
		.banner("Base image stage")
		.FROM("node:22-alpine3.20", { as: opts.as })
		.append(libc6CompatPackage);
}

export function npmDependenciesStage(opts: { from: string }) {
	const df = new Dockerfile();
	df.banner("Npm dependencies stage");
	df.FROM(opts.from, { as: "deps" });
	df.WORKDIR("/app");

	df.group(() => {
		df.COPY(
			["package.json", "yarn.lock*", "package-lock.json*", "pnpm-lock.yaml*", ".npmrc*"],
			"./",
		);
		df.RUN([
			"if [ -f yarn.lock ]; then yarn --frozen-lockfile;",
			"elif [ -f package-lock.json ]; then npm ci;",
			"elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i;",
			'else echo "Lockfile not found." && exit 1;',
			"fi",
		]);
	});

	df.blank();
	return df;
}

export function buildStage(options: { from: string; copyFrom: string }) {
	const stage = new Dockerfile();
	stage.banner("Run build stage");
	stage.FROM(options.from, { as: "builder" });
	stage.WORKDIR("/app");
	stage.group(() => {
		stage.COPY("/app/node_modules", "./node_modules", { from: options.copyFrom });
		stage.COPY(".", ".");
	});
	stage.RUN("npm run build");
	stage.blank();
	return stage;
}
