import { kebabCase } from "case-anything";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "tsup";
import { DockerfileGen } from "~workloads/make/dockerfile-gen.js";
import { installedPackage } from "~workloads/make/installed-packages.js";
import { tsupConfig } from "~workloads/make/tsup.js";
import type { WorkloadImport } from "~workloads/workloads/import.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export async function makeCron(cronImport: WorkloadImport<Cron>) {
	const dir = `crons/${kebabCase(cronImport.workload.id)}`;
	const parsed = path.parse(cronImport.src);

	await buildCron(cronImport, dir);

	const name = buildRunner(dir, parsed);
	buildDockerfile(parsed, dir);

	return {
		path: dir,
		entryPoint: name,
	};
}

async function buildCron(cronImport: WorkloadImport<Cron>, dir: string) {
	await build(tsupConfig([cronImport.src], `.workloads/${dir}`, [/(.*)/]));
}

function buildDockerfile(parsed: path.ParsedPath, dir: string) {
	const dockerfile = cronDockerFile(parsed, dir);
	writeFileSync(
		path.join(`.workloads/${dir}`, `Dockerfile`),
		dockerfile.print(),
	);
}

function buildRunner(dir: string, parsed: path.ParsedPath) {
	const name = `index.mjs`;
	writeFileSync(
		path.join(`.workloads/${dir}`, name),
		`\
import task from "./${parsed.name}.js";

await task.run();
`,
	);
	return name;
}

export function cronDockerFile(parsed: path.ParsedPath, dir: string) {
	const files = [
		path.format({
			root: `.workloads/${dir}/`,
			base: `${parsed.name}.js`,
			ext: ".js",
		}),
		path.format({
			root: `.workloads/${dir}/`,
			base: `${parsed.name}.js.map`,
			ext: ".js.map",
		}),
		path.format({
			root: `.workloads/${dir}/`,
			base: `index.mjs`,
			ext: ".mjs",
		}),
	];

	const prismaInstalled = installedPackage("@prisma/client");

	const dockerfile = new DockerfileGen();

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
		dockerfile.comment("Copy cron files from context");
		files.forEach((file) => dockerfile.COPY(file, `./${path.basename(file)}`));
	});

	dockerfile.ENV("NODE_ENV", "production");

	dockerfile.CMD(["index.mjs"]);

	dockerfile.ENTRYPOINT("node");
	return dockerfile;
}
