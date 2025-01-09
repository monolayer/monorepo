import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { Config } from "../../lib/config";
import type { DockerSwarm } from "../docker-swarm";
import type { Project } from "../project";
import type { Vpc } from "../vpc";
import {
	digitalOceanStatefulWorkloads,
	type DigitalOceanStatefulWorkloadsArgs,
} from "./digital-ocean";
import { swarmStatefulWorkloads, type SwarmStatefulWorkloadArgs } from "./swarm";

export type StatefulWorkloadsArgs = SwarmStatefulWorkloadArgs | DigitalOceanStatefulWorkloadsArgs;

export class StatefulWorkloads extends pulumi.ComponentResource {
	credentials: pulumi.Output<string[]>[];

	constructor(name: string, args: StatefulWorkloadsArgs, opts?: pulumi.ComponentResourceOptions) {
		const modeInConfig = Config.profileName;
		if (modeInConfig !== args.mode) throw new Error(`Unsupported deploymode: ${modeInConfig}`);

		super("workloads:index:StatefulWorkloads", name, args, {
			...opts,
			...{ dependsOn: dependencies(args) },
		});

		switch (args.mode) {
			case "vm-swarm":
				assertSwarmWorkloadMode(args);
				this.credentials = swarmStatefulWorkloads(args.swarm, this);
				break;
			case "digitalocean-swarm":
				assertDigitalOceanWorkloads(args);
				this.credentials = digitalOceanStatefulWorkloads(args, this);
				break;
		}
	}

	static withModeArgs(
		id: string,
		args: { swarm: DockerSwarm; vpc: Vpc; project: Project },
		opts?: pulumi.ComponentResourceOptions,
	) {
		const mode = Config.profileName;

		let workloadArgs: StatefulWorkloadsArgs | undefined = undefined;
		switch (mode) {
			case "vm-swarm":
				workloadArgs = { mode, swarm: args.swarm };
				break;
			case "digitalocean-swarm":
				workloadArgs = { mode, vpc: args.vpc, project: args.project };
				break;
		}
		invariant(workloadArgs);
		return new StatefulWorkloads(id, workloadArgs, opts);
	}

	static createArgs(swarm: DockerSwarm, vpc: Vpc, project: Project) {
		const mode = Config.profileName;

		let workloadArgs: StatefulWorkloadsArgs | undefined = undefined;
		switch (mode) {
			case "vm-swarm":
				workloadArgs = { mode, swarm };
				break;
			case "digitalocean-swarm":
				workloadArgs = { mode, vpc, project };
				break;
		}
		invariant(workloadArgs);
		return workloadArgs;
	}
}

function dependencies(args: StatefulWorkloadsArgs) {
	switch (args.mode) {
		case "vm-swarm":
			assertSwarmWorkloadMode(args);
			return [args.swarm];
		case "digitalocean-swarm":
			assertDigitalOceanWorkloads(args);
			return [args.vpc];
	}
}
function assertSwarmWorkloadMode(value: any): asserts value is SwarmStatefulWorkloadArgs {}

function assertDigitalOceanWorkloads(
	value: any,
): asserts value is DigitalOceanStatefulWorkloadsArgs {}
