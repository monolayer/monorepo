import { Dockerfile } from "@monorepo/docker/df.js";
import path from "node:path";

export function generateNode22Dockerfile(
	files: string[],
	additionalDeps?: { prisma?: boolean },
) {
	const dockerfile = new Dockerfile();
	dockerfile.comment("syntax=docker.io/docker/dockerfile:1");
	dockerfile.blank();

	dockerfile.append(baseStageNode22Alpine320({ as: "base" }));

	if (additionalDeps?.prisma) {
		dockerfile.append(prismaDependenciesStage({ from: "base" }));
	}

	dockerfile.banner("Final stage");

	dockerfile.FROM("base", { as: "run" });

	dockerfile.WORKDIR("/app");

	dockerfile.group(() => {
		dockerfile.comment("Copy files from context");
		files.forEach((file) => dockerfile.COPY(file, `./${path.basename(file)}`));
	});

	if (additionalDeps?.prisma) {
		dockerfile.append(copyPrismaDependencies());
	}

	dockerfile.ENV("NODE_ENV", "production");

	dockerfile.CMD(["index.mjs"]);

	dockerfile.ENTRYPOINT("node");

	return dockerfile;
}

export function baseStageNode22Alpine320(opts: { as: string }) {
	return new Dockerfile()
		.banner("Base image stage")
		.FROM("node:22-alpine3.20", { as: opts.as })
		.comment(
			"Add libc6-compat package (shared library required for use of process.dlopen).",
		)
		.comment(
			"See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine",
		)
		.RUN("apk add --no-cache gcompat=1.1.0-r4")
		.blank();
}

function prismaDependenciesStage(options: { from: string }) {
	const stage = new Dockerfile();
	stage.banner("Prisma dependencies");
	stage.FROM(options.from, { as: "prisma" });
	stage.group(() =>
		[".prisma", "prisma", "@prisma"].forEach((folder) =>
			stage.COPY(`./node_modules/${folder}/`, `./node_modules/${folder}`),
		),
	);
	return stage;
}

function copyPrismaDependencies() {
	const dockerfile = new Dockerfile();
	dockerfile.comment("Copy prisma dependencies");
	dockerfile.group(() => {
		[".prisma", "prisma", "@prisma"].forEach((folder) =>
			dockerfile.COPY(`./node_modules/${folder}/`, `./node_modules/${folder}`, {
				from: "prisma",
			}),
		);
	});
	return dockerfile;
}
