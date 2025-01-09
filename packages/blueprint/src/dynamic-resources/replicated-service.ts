import { serviceCreate, serviceDelete, serviceUpdate, type ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { hashValue } from "../lib/config";
import { withTemporaryContext } from "../lib/docker-context";
import { appLabelKey, fetchService, type Require } from "../lib/docker-objects";

export interface ReplicatedServiceInputs {
	appName: pulumi.Input<string>;
	networkName: pulumi.Input<string>;
	managerPublicIpAddr: pulumi.Input<string>;
	serviceSpec: pulumi.Input<Require<ServiceSpec, "Name" | "TaskTemplate" | "Mode">>;
	registryAuth: pulumi.Input<string>;
}

interface ReplicatedServiceProviderInputs {
	appName: string;
	networkName: string;
	managerPublicIpAddr: string;
	serviceSpec: Require<ServiceSpec, "Name" | "TaskTemplate" | "Mode">;
	registryAuth: string;
}

interface ReplicatedServiceOutputs {
	serviceName: string;
	managerPublicIpAddr: string;
	serviceId: string;
	serviceSpec: pulumi.Input<Require<ServiceSpec, "Name" | "TaskTemplate" | "Mode">>;
	registryAuth: string;
}

class ReplicatedServiceProvider implements pulumi.dynamic.ResourceProvider {
	async create(inputs: ReplicatedServiceProviderInputs): Promise<pulumi.dynamic.CreateResult> {
		const id = `docker-service-${hashValue(inputs.serviceSpec.Name)}`;

		let outs: ReplicatedServiceOutputs | undefined;
		await withTemporaryContext(id, inputs.managerPublicIpAddr, async () => {
			const body = {
				UpdateConfig: {
					Parallelism: 1,
					FailureAction: "rollback" as const,
					MaxFailureRatio: 0,
					Order: "start-first" as const,
				},
				RollbackConfig: {
					Parallelism: 1,
					Order: "stop-first" as const,
				},
				...inputs.serviceSpec,
				Networks: [
					{
						Target: inputs.networkName,
					},
				],
				Labels: {
					...(inputs.serviceSpec.Labels ?? {}),
					[`${appLabelKey}`]: inputs.appName,
				},
			};
			const response = await serviceCreate({
				body,
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
			outs = {
				serviceName: inputs.serviceSpec.Name,
				serviceId: serviceId,
				managerPublicIpAddr: inputs.managerPublicIpAddr,
				serviceSpec: inputs.serviceSpec,
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
		id: pulumi.ID,
		olds: ReplicatedServiceOutputs,
		news: ReplicatedServiceProviderInputs,
	) {
		let outs: ReplicatedServiceOutputs | undefined;
		await withTemporaryContext(id, news.managerPublicIpAddr, async () => {
			const existingService = await fetchService(news.appName, olds.serviceName);
			if (existingService.length === 0) {
				throw new Error("Can't update service: service not found");
			}
			const body = {
				UpdateConfig: {
					Parallelism: 1,
					FailureAction: "rollback" as const,
					MaxFailureRatio: 0,
					Order: "start-first" as const,
				},
				RollbackConfig: {
					Parallelism: 1,
					Order: "stop-first" as const,
				},
				...news.serviceSpec,
				Networks: [
					{
						Target: news.networkName,
					},
				],
				Labels: {
					...(news.serviceSpec.Labels ?? {}),
					[`${appLabelKey}`]: news.appName,
				},
			};

			await serviceUpdate({
				path: { id: olds.serviceId },
				query: {
					version: existingService[0]!.Version!.Index!,
				},
				body,
				...(news.registryAuth
					? {
							headers: {
								"X-Registry-Auth": news.registryAuth,
							},
						}
					: {}),
			});

			const serviceId = olds.serviceId;
			invariant(serviceId, "Expected service ID to be set after creating the service");
			outs = {
				serviceName: news.serviceSpec.Name,
				serviceId: serviceId,
				managerPublicIpAddr: news.managerPublicIpAddr,
				serviceSpec: news.serviceSpec,
				registryAuth: news.registryAuth,
			};
		});
		invariant(outs, "Expected outputs to be set after creating the swarm");
		return {
			id: id,
			outs: outs,
		};
	}

	async delete(id: pulumi.ID, props: ReplicatedServiceOutputs) {
		await withTemporaryContext(id, props.managerPublicIpAddr, async () => {
			await serviceDelete({ path: { id: props.serviceId } });
		});
	}

	async diff(id: pulumi.ID, olds: ReplicatedServiceOutputs, news: ReplicatedServiceProviderInputs) {
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

export class ReplicatedService extends pulumi.dynamic.Resource {
	declare public readonly appName: pulumi.Output<string>;
	declare public readonly managerPublicIpAddr: pulumi.Output<string>;
	declare public readonly serviceId: pulumi.Output<string>;
	declare public readonly serviceName: pulumi.Output<string>;
	declare public readonly registryAuth: pulumi.Output<string>;

	constructor(name: string, props: ReplicatedServiceInputs, opts?: pulumi.CustomResourceOptions) {
		super(
			new ReplicatedServiceProvider(),
			name,
			{ serviceName: undefined, serviceId: undefined, ...props },
			{ ...opts, additionalSecretOutputs: ["registryAuth"] },
			"workloads",
			"ReplicatedService",
		);
	}
}
