import { Dockerfile } from "@monorepo/docker/df.js";
import path from "node:path";

export function generateNode22Dockerfile(
	files: string[],
	additionalDeps?: { prisma?: boolean },
) {
	const dockerfile = new Dockerfile();
	baseStage(dockerfile);
	if (additionalDeps?.prisma) {
		addPrismaDependencies(dockerfile, "base");
	}
	finalStage(dockerfile, additionalDeps?.prisma ? "deps" : "base", files);
	return dockerfile;
}

export function finalStage(
	dockerfile: Dockerfile,
	from: string,
	files: string[],
) {
	dockerfile.blank();
	dockerfile.banner("Final stage");
	dockerfile.FROM(from, { as: "run" });

	dockerfile.group(() => {
		dockerfile.comment("Copy files from context");
		files.forEach((file) => dockerfile.COPY(file, `./${path.basename(file)}`));
	});

	dockerfile.ENV("NODE_ENV", "production");

	dockerfile.CMD(["index.mjs"]);

	dockerfile.ENTRYPOINT("node");
}

export function addPrismaDependencies(dockerfile: Dockerfile, from: string) {
	dockerfile.blank();
	dockerfile.banner("Dependencies stage");
	dockerfile.FROM(from, { as: "deps" });

	dockerfile.comment("Copy Prisma dependencies");
	dockerfile.group(() =>
		[".prisma", "prisma", "@prisma"].forEach((folder) =>
			dockerfile.COPY(`./node_modules/${folder}/`, `./node_modules/${folder}`),
		),
	);
}

export function baseStage(dockerfile: Dockerfile) {
	dockerfile.banner("Base stage");
	dockerfile.FROM("node:22-alpine3.20", { as: "base" });
	dockerfile.comment(
		"Add libc6-compat package (shared library required for use of process.dlopen).",
	);
	dockerfile.comment(
		"See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine",
	);
	dockerfile.RUN("apk add --no-cache gcompat=1.1.0-r4");
	dockerfile.WORKDIR("/app");
}
