import * as pulumi from "@pulumi/pulumi";
import { Config } from "../../lib/config";
import type { DockerSwarm } from "../docker-swarm";
import type { RegistryInfo } from "../registry-info";
import { Job as JobFactory } from "./factories/job";

export type SwarmJobArgs = {
	mode: "vm-swarm";
	swarm: DockerSwarm;
	imageName: string;
	env: {
		Env: string[];
	};
};

export type JobArgs = {
	registry: RegistryInfo;
} & SwarmJobArgs;

export class Job extends pulumi.ComponentResource {
	constructor(name: string, args: JobArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Job", name, args, {
			...opts,
		});

		args.registry.applyInfo((info) => {
			switch (Config.profileName) {
				case "digitalocean-swarm":
				case "vm-swarm":
					this.assertSwarmJob(args);
					this.swarmJob(name, args, info.registryAuth, opts);
			}
		});
	}

	private swarmJob(
		name: string,
		args: SwarmJobArgs,
		registryAuth: string,
		opts?: pulumi.ComponentResourceOptions,
	) {
		return JobFactory.instance()
			.adapter("swarm", {
				networkName: args.swarm.network.networkName,
				managerPublicIpAddr: args.swarm.swarm.managerPublicIpAddr,
			})
			.deploy(
				{
					Name: name,
					TaskTemplate: {
						ContainerSpec: {
							Image: args.imageName,
							...args.env,
						},
						Placement: {
							Constraints: ["node.role == manager"],
						},
					},
				},
				{
					registryAuth: registryAuth,
					pulumi: {
						parent: this,
						dependsOn: opts?.parent,
					},
				},
			);
	}

	private assertSwarmJob(value: unknown): asserts value is SwarmJobArgs {}
}
