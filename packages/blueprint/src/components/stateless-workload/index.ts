import type { ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { Config } from "../../lib/config";
import type { Require } from "../../lib/docker-objects";
import type { DockerSwarm } from "../docker-swarm";
import { StatelessService } from "./factories/service";

export type SwarmStatelessWorkload = {
	mode: "swarm";
	swarm: DockerSwarm;
};

export type StatelessWorkloadArgs = {
	name: string;
	spec: pulumi.Output<Require<ServiceSpec, "Name" | "TaskTemplate">>;
	registryAuth: pulumi.Output<string>;
} & SwarmStatelessWorkload;

export class StatelessWorkload extends pulumi.ComponentResource {
	constructor(name: string, args: StatelessWorkloadArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:StatelessWorkload", name, args, opts);

		switch (Config.profileName) {
			case "vm-swarm":
			case "digitalocean-swarm":
				StatelessService.instance()
					.adapter("swarm", {
						networkName: args.swarm.network.networkName,
						managerPublicIpAddr: args.swarm.swarm.managerPublicIpAddr,
					})
					.deploy(args.name, args.spec, {
						registryAuth: args.registryAuth,
						pulumi: { parent: this, dependsOn: this },
					});
				break;
		}
	}
}
