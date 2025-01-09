import type { ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { Config } from "../lib/config";
import type { Require } from "../lib/docker-objects";
import type { DockerSwarm } from "./docker-swarm";
import { StatelessWorkload } from "./stateless-workload/index";

export interface SwarmCron {
	mode: "swarm";
	swarm: DockerSwarm;
}

export type CronSchedulerArgs = SwarmCron;

export class CronScheduler extends pulumi.ComponentResource {
	constructor(name: string, args: CronSchedulerArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:CronScheduler", name, args, {
			...opts,
		});

		this.deployScheduler(args);
	}

	private deployScheduler(args: CronSchedulerArgs) {
		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				return this.swarmCronScheduler(args);
		}
	}

	private swarmCronScheduler(args: CronSchedulerArgs) {
		if (Config.crons.length !== 0) {
			new StatelessWorkload(
				"cron-scheduler",
				{
					mode: "swarm",
					name: "cron-scheduler",
					swarm: args.swarm,
					spec: pulumi.output(this.cronSchedulerSpec),
					registryAuth: pulumi.output(""),
				},
				{ parent: this },
			);
		}
	}

	private get cronSchedulerSpec() {
		return {
			Name: "cron-scheduler",
			TaskTemplate: {
				ContainerSpec: {
					Image: "crazymax/swarm-cronjob:1.14",
					Env: ['"LOG_LEVEL"="info"', '"LOG_JSON"="false"'],
					Mounts: [
						{
							Type: "bind" as const,
							Source: "/var/run/docker.sock",
							Target: "/var/run/docker.sock",
						},
					],
				},
				Placement: {
					Constraints: ["node.role == manager"],
				},
			},
			Mode: { Replicated: { Replicas: 1 } },
		} satisfies Require<ServiceSpec, "Name" | "TaskTemplate"> as Require<
			ServiceSpec,
			"Name" | "TaskTemplate"
		>;
	}
}
