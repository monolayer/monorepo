import type { CronInto } from "@monolayer/workloads";
import * as dockerBuild from "@pulumi/docker-build";
import * as pulumi from "@pulumi/pulumi";
import path from "node:path";
import invariant from "tiny-invariant";
import { Config, envVars } from "../lib/config";
import { Images } from "../lib/factories/image/image";
import type { DockerSwarm } from "./docker-swarm";
import type { RegistryInfo } from "./registry-info";
import type { StatefulWorkloads } from "./stateful-workloads";
import { StatelessWorkload } from "./stateless-workload";

export interface SwarmCron {
	mode: "swarm";
	swarm: DockerSwarm;
}

export type CronArgs = {
	cron: CronInto;
	registry: RegistryInfo;
	statefulWorkloads: StatefulWorkloads;
} & SwarmCron;

export class Cron extends pulumi.ComponentResource {
	version: string;
	imageDigest: pulumi.Output<string> | undefined;
	imageRef: pulumi.Output<string> | undefined;
	imageName: pulumi.Output<string> | undefined;
	declare workload: pulumi.Output<StatelessWorkload>;
	schedule: string;
	cronId: string;

	constructor(name: string, args: CronArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Cron", name, args, {
			...pulumi.mergeOptions(opts, { dependsOn: args.statefulWorkloads }),
		});

		let swarmBuild: ReturnType<typeof this.dockerBuildImage>;

		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				swarmBuild = this.dockerBuildImage(args);
				break;
		}

		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				invariant(swarmBuild, "Expected swarmBuild to be defined");
				this.workload = this.swarmTask(args, swarmBuild.image, swarmBuild.imageName);
				break;
		}

		this.schedule = args.cron.schedule;
		this.cronId = args.cron.id;
		this.version = Config.app.version;

		this.registerOutputs({
			imageDigest: this.imageDigest,
			imageRef: this.imageRef,
			version: this.version,
			imageName: this.imageName,
			schedule: this.schedule,
			cronId: args.cron.id,
			workload: this.workload,
		});
	}

	private dockerBuildImage(args: CronArgs) {
		const cron = Config.buildManifest.cron.find((t) => t.id === args.cron.id);
		invariant(cron, `Expected cron with id ${args.cron.id} in manifest.json`);

		this.imageName = args.registry.name.apply((n) => `${n}/cron-${cron.id}:${Config.app.version}`);

		const options = {
			imageName: args.registry.name.apply((n) => `${n}/cron-${cron.id}:${Config.app.version}`),
			dockerFile: path.join(Config.app.root, ".workloads", cron.path, "..", cron.dockerfile),
			platforms: pulumi.output(Config.dockerBuildPlatforms as dockerBuild.Platform[]),
			context: Config.app.root,
			registry: {
				username: Config.registryUsername,
				password: Config.registryPassword,
				address: args.registry.serverAddress,
			},
		};

		const imagesAdapter = Images.instance().adapter("docker-build");

		const image = imagesAdapter.buildAndPush(
			`cron-${args.cron.id}:${Config.app.version}`,
			options,
			{
				parent: this,
			},
		);
		return {
			image,
			imageName: this.imageName,
		};
	}

	private swarmTask(args: CronArgs, image: dockerBuild.Image, imageName: pulumi.Output<string>) {
		return imageName.apply(
			(n) =>
				new StatelessWorkload(
					args.cron.id,
					{
						mode: "swarm",
						swarm: args.swarm,
						name: args.cron.id,
						spec: this.cronSpec(
							args.cron.id,
							n,
							args.cron.schedule,
							args.statefulWorkloads.credentials,
						),
						registryAuth: args.registry.registryAuth(),
					},
					{ dependsOn: image, parent: this },
				),
		);
	}

	cronSpec(id: string, name: string, schedule: string, credentials: pulumi.Output<string[]>[]) {
		return pulumi.all([credentials]).apply(([creds]) => {
			const env = envVars(creds);
			return {
				Name: id,
				TaskTemplate: {
					ContainerSpec: {
						Image: name,
						...env,
					},
					RestartPolicy: {
						Condition: "none" as const,
					},
				},
				Mode: { Replicated: { Replicas: 0 } },
				Labels: {
					"swarm.cronjob.enable": "true",
					"swarm.cronjob.schedule": schedule,
					"swarm.cronjob.skip-running": "false",
				},
			};
		});


	}
}
