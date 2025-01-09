import * as digitalocean from "@pulumi/digitalocean";
import * as pulumiNull from "@pulumi/null";
import * as pulumi from "@pulumi/pulumi";
import * as time from "@pulumiverse/time";
import { Config } from "../../lib/config";
import type { Project } from "../project";
import { Network } from "./factories/network/network";

export interface VpcArgs {
	project: Project;
}

export class Vpc extends pulumi.ComponentResource {
	vpc: digitalocean.Vpc | pulumiNull.Resource;

	constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Vpc", name, args, {
			...opts,
		});
		this.vpc = this.deployVpc(args);

		new time.Sleep(
			"wait-before-destroy",
			{ destroyDuration: "15s" },
			{
				dependsOn: [this.vpc],
				parent: this,
			},
		);
	}

	deployVpc(args: VpcArgs) {
		const resourceOptions = {
			parent: this,
			dependsOn: [args.project.project],
			retainOnDelete: Config.retainStateOnDelete,
		};

		switch (Config.profileName) {
			case "digitalocean-swarm":
				return Network.instance()
					.adapter("digitalocean", {
						region: Config.digitalOceanSwarmProfile.region,
					})
					.deploy({
						name: `${Config.app.name}-vpc`,
						vpcIpRange: Config.digitalOceanSwarmProfile.vpcIpRange,
						pulumiResourceOptions: resourceOptions,
					});
			case "vm-swarm":
				return new pulumiNull.Resource(
					"project",
					{
						triggers: {
							project: args.project.project.id,
						},
					},
					resourceOptions,
				);
		}
	}
}
