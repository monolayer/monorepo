import { serviceCreate, serviceDelete, type ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { hashValue } from "../lib/config";
import { withTemporaryContext } from "../lib/docker-context";
import {
	appLabelKey,
	streamLogs,
	waitUntilTaskIsComplete,
	waitUntilTaskIsRunning,
	type Require,
} from "../lib/docker-objects";

export interface ReplicatedJobServiceInputs {
	appName: pulumi.Input<string>;
	networkName: pulumi.Input<string>;
	managerPublicIpAddr: pulumi.Input<string>;
	maxConcurrent: pulumi.Input<number>;
	serviceSpec: pulumi.Input<Require<ServiceSpec, "Name" | "TaskTemplate">>;
	registryAuth?: pulumi.Input<string>;
}

interface ReplicatedServiceProviderInputs {
	appName: string;
	networkName: string;
	managerPublicIpAddr: string;
	maxConcurrent: number;
	serviceSpec: Require<ServiceSpec, "Name" | "TaskTemplate">;
	registryAuth?: string;
}

interface ReplicatedServiceOutputs {
	serviceName: string;
	managerPublicIpAddr: string;
	serviceId: string;
	serviceSpec: pulumi.Input<Require<ServiceSpec, "Name" | "TaskTemplate">>;
	maxConcurrent: number;
	registryAuth?: string;
}

class ReplicatedServiceProvider implements pulumi.dynamic.ResourceProvider {
	async create(inputs: ReplicatedServiceProviderInputs): Promise<pulumi.dynamic.CreateResult> {
		const id = `docker-service-${hashValue(inputs.serviceSpec.Name)}`;

		let outs: ReplicatedServiceOutputs | undefined;
		await withTemporaryContext(id, inputs.managerPublicIpAddr, async () => {
			const response = await serviceCreate({
				body: {
					...inputs.serviceSpec,
					TaskTemplate: {
						...inputs.serviceSpec.TaskTemplate,
						RestartPolicy: {
							Condition: "none",
						},
					},
					Networks: [
						{
							Target: inputs.networkName,
						},
					],
					Labels: {
						...(inputs.serviceSpec.Labels ?? {}),
						[`${appLabelKey}`]: inputs.appName,
					},
					Mode: { ReplicatedJob: { MaxConcurrent: inputs.maxConcurrent ?? 1 } },
				},
				...(inputs.registryAuth
					? {
							headers: {
								"X-Registry-Auth": inputs.registryAuth,
							},
						}
					: {}),
			});
			const serviceId = response.ID;
			invariant(serviceId, "Expected service ID to be set after creating the service");
			await waitUntilTaskIsRunning(serviceId, inputs.serviceSpec.Name);

			const controller = streamLogs(serviceId);

			await waitUntilTaskIsComplete(serviceId);

			controller.abort();

			await serviceDelete({ path: { id: serviceId } });

			outs = {
				serviceName: inputs.serviceSpec.Name,
				serviceId: serviceId,
				managerPublicIpAddr: inputs.managerPublicIpAddr,
				serviceSpec: inputs.serviceSpec,
				maxConcurrent: inputs.maxConcurrent,
				registryAuth: inputs.registryAuth,
			};
		});

		invariant(outs, "Expected outputs to be set after creating the swarm");
		return {
			id: id,
			outs: outs,
		};
	}

	async update(
		_id: pulumi.ID,
		_olds: ReplicatedServiceOutputs,
		news: ReplicatedServiceProviderInputs,
	) {
		return await this.create(news);
	}

	async diff(
		_id: pulumi.ID,
		olds: ReplicatedServiceOutputs,
		news: ReplicatedServiceProviderInputs,
	) {
		const replaces: string[] = [];
		const serviceNameChange = olds.serviceName !== news.serviceSpec.Name;
		const changes =
			serviceNameChange ||
			JSON.stringify(olds.serviceSpec) !== JSON.stringify(news.serviceSpec) ||
			olds.registryAuth !== news.registryAuth;

		if (serviceNameChange) {
			replaces.push("serviceName");
		}
		return {
			changes,
			replaces,
			deleteBeforeReplace: false,
		};
	}
}

export class ReplicatedJobService extends pulumi.dynamic.Resource {
	declare public readonly appName: pulumi.Output<string>;
	declare public readonly managerPublicIpAddr: pulumi.Output<string>;
	declare public readonly serviceId: pulumi.Output<string>;
	declare public readonly serviceName: pulumi.Output<string>;
	declare public readonly maxConcurrent: pulumi.Output<string>;
	declare public readonly registryAuth?: pulumi.Output<string>;

	constructor(
		name: string,
		props: ReplicatedJobServiceInputs,
		opts?: pulumi.CustomResourceOptions,
	) {
		super(
			new ReplicatedServiceProvider(),
			name,
			{ serviceName: undefined, serviceId: undefined, ...props },
			{ ...opts, additionalSecretOutputs: ["registryAuth"] },
			"workloads",
			"ReplicatedJobService",
		);
	}
}
