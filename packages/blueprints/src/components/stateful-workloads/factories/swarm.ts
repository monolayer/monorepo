import type { TaskSpec } from "@monolayer/dsdk";
import type { CustomResourceOptions } from "@pulumi/pulumi";
import { ReplicatedService } from "../../../dynamic-resources/replicated-service";
import { singleReplicaService } from "../../../lib/docker-objects";
import type { DockerSwarm } from "../../docker-swarm";

export abstract class SwarmStatefulWorkload<T extends { appName: string; registryAuth?: string }> {
	config: T;

	constructor(config: T) {
		this.config = config;
	}

	deploy(workloadId: string, swarm: DockerSwarm, resourceOptions?: CustomResourceOptions) {
		const spec = singleReplicaService(workloadId, this.spec(workloadId));
		return new ReplicatedService(
			spec.Name!,
			{
				appName: this.config.appName,
				networkName: swarm.network.networkName,
				serviceSpec: spec,
				registryAuth: this.config.registryAuth ?? "",
				managerPublicIpAddr: swarm.swarm.managerPublicIpAddr,
			},
			{
				parent: swarm.swarm,
				dependsOn: [swarm.network, swarm.swarm],
				...(resourceOptions ? resourceOptions : {}),
			},
		);
	}

	abstract spec(workloadId: string): TaskSpec;
}
