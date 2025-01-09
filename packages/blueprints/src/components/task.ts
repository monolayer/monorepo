import type { TaskInfo } from "@monolayer/workloads";
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

export interface SwarmTask {
	mode: "swarm";
	swarm: DockerSwarm;
}

export type TaskArgs = {
	task: TaskInfo;
	registry: RegistryInfo;
	statefulWorkloads: StatefulWorkloads;
} & SwarmTask;

export class Task extends pulumi.ComponentResource {
	version: string;
	imageDigest: pulumi.Output<string> | undefined;
	imageRef: pulumi.Output<string> | undefined;
	imageName: pulumi.Output<string> | undefined;
	taskId: string;
	declare workload: pulumi.Output<StatelessWorkload>;

	constructor(name: string, args: TaskArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Task", name, args, {
			...pulumi.mergeOptions(opts, { dependsOn: args.statefulWorkloads }),
		});

		this.taskId = args.task.id;

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

		this.version = Config.app.version;

		name: this.imageName,
			this.registerOutputs({
				imageDigest: this.imageDigest,
				imageRef: this.imageRef,
				version: this.version,
				imageName: this.imageName,
				taskId: this.taskId,
				workload: this.workload,
			});
	}

	private dockerBuildImage(args: TaskArgs) {
		const task = Config.buildManifest.task.find((t) => t.id === args.task.id);
		invariant(task, `Expected task with id ${args.task.id} in manifest.json`);

		const options = {
			imageName: args.registry.name.apply((n) => `${n}/task-${task.id}:${Config.app.version}`),
			dockerFile: path.join(Config.app.root, ".workloads", task.path, "..", task.dockerfile),
			platforms: pulumi.output(Config.dockerBuildPlatforms as dockerBuild.Platform[]),
			context: Config.app.root,
			registry: {
				username: Config.registryUsername,
				password: Config.registryPassword,
				address: args.registry.serverAddress,
			},
		};

		const imagesAdapter = Images.instance().adapter("docker-build");

		this.imageName = args.registry.name.apply((n) => `${n}/task-${task.id}:${Config.app.version}`);
		const image = imagesAdapter.buildAndPush(
			`task-${args.task.id}:${Config.app.version}`,
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

	private swarmTask(args: TaskArgs, image: dockerBuild.Image, imageName: pulumi.Output<string>) {
		return imageName.apply(
			(n) =>
				new StatelessWorkload(
					args.task.id,
					{
						mode: "swarm",
						swarm: args.swarm,
						name: args.task.id,
						spec: this.taskSpec(args.task.id, n, args.statefulWorkloads.credentials),
						registryAuth: args.registry.registryAuth(),
					},
					{ dependsOn: image, parent: this },
				),
		);
	}

	taskSpec(id: string, name: string, credentials: pulumi.Output<string[]>[]) {
		return pulumi.all([credentials]).apply(([creds]) => {
			const env = envVars(creds);
			return {
				Name: id,
				TaskTemplate: {
					ContainerSpec: {
						Image: name,
						...env,
					},
				},
				Mode: { Replicated: { Replicas: 1 } },
			};
		});

		// return {
		// 	Name: id,
		// 	TaskTemplate: {
		// 		ContainerSpec: {
		// 			Image: name,
		// 			...env,
		// 		},
		// 	},
		// 	Mode: { Replicated: { Replicas: 1 } },
		// };
	}
}
