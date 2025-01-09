import { Dockerfile } from "@monolayer/dw";
import * as dockerBuild from "@pulumi/docker-build";
import * as pulumi from "@pulumi/pulumi";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import invariant from "tiny-invariant";
import { Config, envVars } from "../lib/config";
import { baseStageNode22Alpine320 } from "../lib/dockerfile-helpers";
import type { DockerSwarm } from "./docker-swarm";
import { Job } from "./job";
import type { RegistryInfo } from "./registry-info";
import type { StatefulWorkloads } from "./stateful-workloads";
import { Images } from "../lib/factories/image/image";

export interface SwarmPrismaMigrate {
	mode: "swarm";
	swarm: DockerSwarm;
}

export type PrismaMigrageArgs = {
	registry: RegistryInfo;
	statefulWorkloads: StatefulWorkloads;
} & SwarmPrismaMigrate;

export class PrismaMigrate extends pulumi.ComponentResource {
	imageDigest: pulumi.Output<string> | undefined;
	imageRef: pulumi.Output<string> | undefined;
	imageName: pulumi.Output<string> | undefined;
	job: pulumi.Output<Job> | undefined;
	version: string;

	constructor(name: string, args: PrismaMigrageArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:PrismaMigrate", name, args, {
			...pulumi.mergeOptions(opts, { dependsOn: args.statefulWorkloads }),
		});

		let swarmBuild: ReturnType<typeof this.dockerBuildImage>;
		let job: pulumi.Output<Job> | undefined;

		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				swarmBuild = this.dockerBuildImage(args);
				break;
		}

		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				if (swarmBuild) {
					job = this.deploySwarmJob(swarmBuild.image, swarmBuild.imageName, args);
				}
				break;
		}

		this.version = Config.app.version;

		this.registerOutputs({
			imageDigest: this.imageDigest,
			imageRef: this.imageRef,
			name: this.imageName,
			version: this.version,
			job,
		});
	}

	dockerBuildImage(args: PrismaMigrageArgs) {
		const dockerfilePath = prismaMigrate();
		if (dockerfilePath) {
			this.imageName = args.registry.name.apply((n) => `${n}/prisma-migrate:${Config.app.version}`);

			const options = {
				imageName: this.imageName,
				dockerFile: dockerfilePath,
				platforms: pulumi.output(Config.dockerBuildPlatforms as dockerBuild.Platform[]),
				context: Config.app.root,
				registry: {
					username: Config.registryUsername,
					password: Config.registryPassword,
					address: args.registry.serverAddress,
				},
			};
			const imagesAdapter = Images.instance().adapter("docker-build");

			const image = imagesAdapter.buildAndPush(`prisma-migrate:${Config.app.version}`, options, {
				parent: this,
			});
			this.imageDigest = image.digest;
			this.imageRef = image.ref;
			return {
				image,
				imageName: this.imageName,
			};
		}
		return;
	}

	deploySwarmJob(
		image: dockerBuild.Image,
		imageName: pulumi.Output<string>,
		args: PrismaMigrageArgs,
	) {
		return pulumi.all([imageName, args.statefulWorkloads.credentials]).apply(
			([imageName, credentials]) =>
				new Job(
					"migrate-db",
					{
						mode: "vm-swarm",
						swarm: args.swarm,
						imageName: imageName,
						env: envVars(credentials),
						registry: args.registry,
					},
					{ parent: this, dependsOn: image },
				),
		);
		// return imageName.apply(
		// 	(imageName) =>
		// 		new Job(
		// 			"migrate-db",
		// 			{
		// 				mode: "vm-swarm",
		// 				swarm: args.swarm,
		// 				imageName: imageName,
		// 				env: args.env,
		// 				registry: args.registry,
		// 			},
		// 			{ parent: this, dependsOn: image },
		// 		),
		// );
	}
}

export function prismaMigrate() {
	const prismaClientVersion = version("@prisma/client");
	if (prismaClientVersion) {
		const prismaDockerfilePath = path.join(Config.app.root, ".workloads/prisma.Dockerfile");
		const prismaVersion = version("prisma");
		invariant(prismaVersion);
		const prismaDockerfile = prismaMigrateDeployDockerfile({
			projectRoot: Config.app.root,
			prismaClientVersion,
			prismaVersion,
		});
		prismaDockerfile.save(prismaDockerfilePath);
		return prismaDockerfilePath;
	}
	return;
}

export function prismaMigrateDeployDockerfile(options: {
	prismaVersion: string;
	prismaClientVersion: string;
	projectRoot: string;
}) {
	const dockerfile = new Dockerfile();
	dockerfile.append(baseStageNode22Alpine320({ as: "base" }));

	dockerfile.banner("Prisma dependencies");
	dockerfile.FROM("base", { as: "prisma" });
	dockerfile.WORKDIR("/app");
	dockerfile.RUN(`npm install prisma@${options.prismaVersion}`);
	dockerfile.RUN(`npm install @prisma/client@${options.prismaClientVersion}`);

	dockerfile.banner("Run stage");
	dockerfile.FROM("base", { as: "run" });

	dockerfile.WORKDIR("/app");

	dockerfile.comment("Copy Prisma dependencies");
	dockerfile.group(() => {
		dockerfile.COPY(`/app/node_modules`, `./node_modules`, {
			from: "prisma",
		});
	});

	const prismaSchemaLocation = packageJsonPrismaSchema(options.projectRoot);
	const schemaLocations = prismaSchemaLocation
		? [prismaSchemaLocation]
		: ["*schema.prisma", "*prisma/schema.prisma", "*prisma/schema"];

	dockerfile.comment("Copy Prisma schema(s)");
	dockerfile.group(() => {
		schemaLocations.forEach((file) => dockerfile.COPY(`*${file}`, `./${file}`));
	});

	dockerfile.comment("Generate Prisma client");
	dockerfile.RUN("npx prisma generate");

	dockerfile.ENTRYPOINT("npx", ["prisma", "migrate", "deploy"]);
	return dockerfile;
}

export function packageJsonPrismaSchema(rootPath: string) {
	const packageJson = JSON.parse(readFileSync(path.join(rootPath, "package.json")).toString());
	if (packageJson.prisma && packageJson.prisma.schema) {
		return packageJson.prisma.schema as string;
	}
	return;
}

function version(packageName: string) {
	const list = packageList();
	return (list.dependencies ?? {})[packageName]?.version;
}

function packageList() {
	try {
		const output = execSync("npm list --json", { cwd: Config.app.root }).toString().trim();
		return JSON.parse(output);
	} catch {
		throw new Error("Failed to get git commit hash. Are you in a git repository?");
	}
}
