import path from "node:path";
import { DockerfileGen } from "~workloads/beamer/blueprints/docker/dockerfile-gen.js";
import { installedPackage } from "~workloads/beamer/scan/installed-packages.js";

export function generateNode20Dockerfile(files: string[]) {
	const prismaInstalled = installedPackage("@prisma/client");
	const dockerfile = new DockerfileGen();
	baseStage(dockerfile);
	addPrismaDependencies(prismaInstalled, dockerfile);
	finalStage(dockerfile, prismaInstalled, files);
	return dockerfile.print();
}

export function finalStage(
	dockerfile: DockerfileGen,
	prismaInstalled: boolean,
	files: string[],
) {
	dockerfile.blank();
	dockerfile.banner("Final stage");
	dockerfile.FROM(prismaInstalled ? "deps" : "base", { as: "run" });

	if (prismaInstalled) {
		dockerfile.group(() => {
			dockerfile.comment("Copy Prisma dependencies from deps stage");
			dockerfile.COPY("/app/node_modules", "./node_modules", { from: "deps" });
		});
	}

	dockerfile.group(() => {
		dockerfile.comment("Copy files from context");
		files.forEach((file) => dockerfile.COPY(file, `./${path.basename(file)}`));
	});

	dockerfile.ENV("NODE_ENV", "production");

	dockerfile.CMD(["index.mjs"]);

	dockerfile.ENTRYPOINT("node");
}

export function addPrismaDependencies(
	prismaInstalled: boolean,
	dockerfile: DockerfileGen,
) {
	if (prismaInstalled) {
		dockerfile.blank();
		dockerfile.banner("Dependencies stage");
		dockerfile.FROM("base", { as: "deps" });

		dockerfile.comment("Copy Prisma dependencies");
		dockerfile.group(() =>
			[".prisma", "prisma", "@prisma"].forEach((folder) =>
				dockerfile.COPY(
					`./node_modules/${folder}/`,
					`./node_modules/${folder}`,
				),
			),
		);
	}
}

export function baseStage(dockerfile: DockerfileGen) {
	dockerfile.banner("Base stage");
	dockerfile.FROM("node:20-alpine3.20", { as: "base" });
	dockerfile.comment(
		"Add libc6-compat package (shared library required for use of process.dlopen).",
	);
	dockerfile.comment(
		"See https://github.com/nodejs/docker-node?tab=readme-ov-file#nodealpine",
	);
	dockerfile.RUN("apk add --no-cache gcompat=1.1.0-r4");
	dockerfile.WORKDIR("/app");
}
