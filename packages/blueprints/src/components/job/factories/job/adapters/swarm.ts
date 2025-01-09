import type { ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { ReplicatedJobService } from "../../../../../dynamic-resources/replicated-job-service";
import { Config } from "../../../../../lib/config";
import type { Require } from "../../../../../lib/docker-objects";

export interface SwarmConfig {
	networkName: string | pulumi.Output<string>;
	managerPublicIpAddr: string | pulumi.Output<string>;
}

export class Swarm {
	constructor(public config: SwarmConfig) {}

	deploy(
		serviceSpec: Require<ServiceSpec, "Name" | "TaskTemplate">,
		options?: {
			registryAuth?: string;
			maxConcurrent?: number;
			pulumi?: pulumi.CustomResourceOptions;
		},
	) {
		return new ReplicatedJobService(
			"migrate-db",
			{
				appName: Config.app.name,
				networkName: this.config.networkName,
				managerPublicIpAddr: this.config.managerPublicIpAddr,
				maxConcurrent: options?.maxConcurrent ?? 1,
				serviceSpec,
				registryAuth: options?.registryAuth,
			},
			options?.pulumi,
		);
	}
}
