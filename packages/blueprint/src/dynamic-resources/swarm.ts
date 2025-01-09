import { swarmLeave } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { hashValue } from "../lib/config";
import { withTemporaryContext } from "../lib/docker-context";
import type { CreateSwarmOptions } from "../lib/docker-objects";
import * as docker from "../lib/docker-objects";

export interface DockerSwarmInputs {
	appName: pulumi.Input<string>;
	managerPublicIpAddr: pulumi.Input<string>;
	managerPrivateIpAddr: pulumi.Input<string>;
	swarmOptions: pulumi.Input<CreateSwarmOptions>;
}

interface DockerSwarmProviderInputs {
	appName: string;
	managerPublicIpAddr: string;
	managerPrivateIpAddr: string;
	swarmOptions: CreateSwarmOptions;
}

interface DockerSwarmOutputs {
	workerToken: string;
	managerPublicIpAddr: string;
	managerNodeId: string;
	swarmOptions: CreateSwarmOptions;
}

class DockerSwarmProvider implements pulumi.dynamic.ResourceProvider {
	async create(inputs: DockerSwarmProviderInputs): Promise<pulumi.dynamic.CreateResult> {
		const id = `swarm-${hashValue(inputs.managerPublicIpAddr)}`;

		let outs: DockerSwarmOutputs | undefined;

		await withTemporaryContext(id, inputs.managerPublicIpAddr, async () => {
			const swarm = await docker.initSwarm(inputs.appName, inputs.managerPrivateIpAddr, [], {
				...inputs.swarmOptions,
			});
			outs = {
				managerPublicIpAddr: inputs.managerPublicIpAddr,
				swarmOptions: inputs.swarmOptions,
				...swarm,
			};
		});
		invariant(outs, "Expected outputs to be set after creating the swarm");

		return {
			id: id,
			outs: {
				workerToken: outs.workerToken,
				managerPublicIpAddr: outs.managerPublicIpAddr,
				managerNodeId: outs.managerNodeId,
			},
		};
	}

	async delete(id: pulumi.ID, props: DockerSwarmOutputs) {
		await withTemporaryContext(id, props.managerPublicIpAddr, async () => {
			await swarmLeave({ query: { force: true } });
		});
	}
}

export class Swarm extends pulumi.dynamic.Resource {
	declare public readonly appName: pulumi.Output<string>;
	declare public readonly workerToken: pulumi.Output<string>;
	declare public readonly managerPrivateIpAddr: pulumi.Output<string>;
	declare public readonly managerPublicIpAddr: pulumi.Output<string>;
	declare public readonly managerNodeId: pulumi.Output<string>;

	constructor(name: string, props: DockerSwarmInputs, opts?: pulumi.CustomResourceOptions) {
		super(
			new DockerSwarmProvider(),
			name,
			{ managerNodeId: undefined, workerToken: undefined, ...props },
			{ ...opts, additionalSecretOutputs: ["workerToken"] },
			"workloads",
			"Swarm",
		);
	}
}
