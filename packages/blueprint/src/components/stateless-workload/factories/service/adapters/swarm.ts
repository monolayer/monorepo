import type { ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { ReplicatedService } from "../../../../../dynamic-resources/replicated-service";
import { Config } from "../../../../../lib/config";
import type { Require } from "../../../../../lib/docker-objects";

export interface SwarmConfig {
	networkName: string | pulumi.Output<string>;
	managerPublicIpAddr: string | pulumi.Output<string>;
}

export class Swarm {
	constructor(public config: SwarmConfig) {}

	deploy(
		name: string,
		serviceSpec: pulumi.Output<Require<ServiceSpec, "Name" | "TaskTemplate">>,
		options?: {
			registryAuth?: pulumi.Output<string>;
			pulumi?: pulumi.CustomResourceOptions;
		},
	) {
		serviceSpec.apply(
			(spec) =>
				new ReplicatedService(
					name,
					{
						serviceSpec: {
							Mode: {
								Replicated: {
									Replicas: 1,
								},
							},
							...spec,
						},
						appName: Config.app.name,
						networkName: this.config.networkName,
						managerPublicIpAddr: this.config.managerPublicIpAddr,
						registryAuth: options?.registryAuth ?? "",
					},
					options?.pulumi,
				),
		);
		// return new ReplicatedService(
		// 	name,
		// 	{
		// 		serviceSpec: {
		// 			Mode: {
		// 				Replicated: {
		// 					Replicas: 1,
		// 				},
		// 			},
		// 			...serviceSpec,
		// 		},
		// 		appName: Config.app.name,
		// 		networkName: this.config.networkName,
		// 		managerPublicIpAddr: this.config.managerPublicIpAddr,
		// 		registryAuth: options?.registryAuth ?? "",
		// 	},
		// 	options?.pulumi,
		// );
	}
}
