import { nodeDelete, swarmJoin, swarmLeave, systemInfo } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { hashValue } from "../lib/config";
import { withTemporaryContext } from "../lib/docker-context";

export interface DockerSwarmWorkerOptions {
	managerIpv4Address: pulumi.Input<string>;
	managerIpv4AddressPrivate: pulumi.Input<string>;
	workerIpv4Address: pulumi.Input<string>;
	workerIpv4AddressPrivate: pulumi.Input<string>;
	token: pulumi.Input<string>;
}

interface DockerSwarmWorkerProviderInputs {
	managerIpv4Address: string;
	managerIpv4AddressPrivate: string;
	workerIpv4Address: string;
	workerIpv4AddressPrivate: string;
	token: string;
}

interface DynamicProviderOutputs extends Omit<DockerSwarmWorkerProviderInputs, "token"> {
	nodeId: string;
}

class DockerSwarmWorkerProvider implements pulumi.dynamic.ResourceProvider {
	async create(inputs: DockerSwarmWorkerProviderInputs): Promise<pulumi.dynamic.CreateResult> {
		const id = `swarm-worker-${hashValue(inputs.workerIpv4Address)}`;

		let nodeId: string | undefined;
		await withTemporaryContext(id, inputs.workerIpv4Address, async () => {
			await swarmJoin({
				body: {
					ListenAddr: inputs.workerIpv4AddressPrivate,
					AdvertiseAddr: inputs.workerIpv4AddressPrivate,
					RemoteAddrs: [`${inputs.managerIpv4AddressPrivate}:2377`],
					JoinToken: inputs.token,
				},
			});
			const info = await systemInfo({});
			nodeId = info.Swarm?.NodeID;
		});
		invariant(nodeId, "Expected node to have an ID");

		return {
			id: id,
			outs: {
				nodeId: nodeId,
				managerIpv4Address: inputs.managerIpv4Address,
				managerIpv4AddressPrivate: inputs.managerIpv4AddressPrivate,
				workerIpv4Address: inputs.workerIpv4Address,
				workerIpv4AddressPrivate: inputs.workerIpv4AddressPrivate,
			} satisfies DynamicProviderOutputs,
		};
	}

	async delete(id: pulumi.ID, props: DynamicProviderOutputs) {
		await withTemporaryContext(id, props.workerIpv4Address, async () => {
			await swarmLeave({ query: { force: true } });
		});
		await withTemporaryContext(`${id}-manager`, props.managerIpv4Address, async () => {
			await nodeDelete({ path: { id: props.nodeId }, query: { force: true } });
		});
	}
}

export class SwarmWorker extends pulumi.dynamic.Resource {
	declare public readonly nodeId: pulumi.Output<string>;
	declare public readonly managerIpv4Address: pulumi.Output<string>;
	declare public readonly managerIpv4AddressPrivate: pulumi.Output<string>;
	declare public readonly workerIpv4Address: pulumi.Output<string>;
	declare public readonly workerIpv4AddressPrivate: pulumi.Output<string>;

	constructor(name: string, props: DockerSwarmWorkerOptions, opts?: pulumi.CustomResourceOptions) {
		super(
			new DockerSwarmWorkerProvider(),
			name,
			{
				nodeId: undefined,
				...props,
			},
			{
				...opts,
				ignoreChanges: ["token"],
			},
			"workloads",
			"SwarmWorker",
		);
	}
}
