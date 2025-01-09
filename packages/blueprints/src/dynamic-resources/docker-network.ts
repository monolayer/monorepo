import { networkCreate, networkDelete } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { hashValue } from "../lib/config";
import { withTemporaryContext } from "../lib/docker-context";

export interface DockerNetworkInputs {
	appName: pulumi.Input<string>;
	managerPublicIpAddr: pulumi.Input<string>;
}

interface DockerNetworkProviderInputs {
	appName: string;
	managerPublicIpAddr: string;
}

interface DockerNetworkOutputs {
	managerPublicIpAddr: string;
	networkName: string;
	networkId: string;
}

class DockerNetworkProvider implements pulumi.dynamic.ResourceProvider {
	async create(inputs: DockerNetworkProviderInputs): Promise<pulumi.dynamic.CreateResult> {
		const id = `swarm-${hashValue(inputs.managerPublicIpAddr)}`;

		let outs: DockerNetworkOutputs | undefined;
		await withTemporaryContext(id, inputs.managerPublicIpAddr, async () => {
			const networkName = `${inputs.appName}-network`;

			const response = await networkCreate({
				body: {
					Name: networkName,
					Driver: "overlay",
					Labels: {
						["com.blueprints.app"]: inputs.appName,
					},
				},
			});
			const networkId = response.Id;

			invariant(networkId, "Expected network ID to be set after creating the network");
			outs = {
				managerPublicIpAddr: inputs.managerPublicIpAddr,
				networkId,
				networkName: networkName,
			};
		});
		invariant(outs, "Expected outputs to be set after creating the swarm");

		return {
			id: id,
			outs,
		};
	}

	async delete(id: pulumi.ID, props: DockerNetworkOutputs) {
		await withTemporaryContext(id, props.managerPublicIpAddr, async () => {
			await networkDelete({ path: { id: props.networkId } });
		});
	}
}

export class DockerNetwork extends pulumi.dynamic.Resource {
	declare public readonly appName: pulumi.Output<string>;
	declare public readonly managerPublicIpAddr: pulumi.Output<string>;
	declare public readonly networkName: pulumi.Output<string>;
	declare public readonly networkId: pulumi.Output<string>;

	constructor(name: string, props: DockerNetworkInputs, opts?: pulumi.CustomResourceOptions) {
		super(
			new DockerNetworkProvider(),
			name,
			{ networkName: undefined, networkId: undefined, ...props },
			opts,
			"workloads",
			"DockerNetwork",
		);
	}
}
