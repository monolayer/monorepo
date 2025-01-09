import * as pulumi from "@pulumi/pulumi";
import { Config } from "../../lib/config";
import type { Project } from "../project";
import type { Vpc } from "../vpc";
import { bareSwarmCompute } from "./bare-swarm";
import { digitalOceanSwarmCompute } from "./digitalocean-swarm";

export type ComputeArgs = {
	vpc: Vpc;
	project: Project;
};

export class Compute extends pulumi.ComponentResource {
	manager: {
		ipv4Address: pulumi.Output<string>;
		ipv4AddressPrivate: pulumi.Output<string>;
		id: pulumi.Output<string>;
	};
	workers: {
		ipv4Address: pulumi.Output<string>;
		ipv4AddressPrivate: pulumi.Output<string>;
		id: pulumi.Output<string>;
	}[];

	constructor(name: string, args: ComputeArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Compute", name, args, {
			...opts,
			dependsOn: [args.vpc, args.project],
		});
		const compute = this.deployCompute(args);
		this.manager = compute.manager;
		this.workers = compute.workers;

		this.registerOutputs({
			manager: this.manager,
			workers: this.workers,
		});
	}

	deployCompute(args: ComputeArgs) {
		switch (Config.profileName) {
			case "digitalocean-swarm":
				return digitalOceanSwarmCompute(args, this);
			case "vm-swarm":
				return bareSwarmCompute(args, this);
		}
	}
}
