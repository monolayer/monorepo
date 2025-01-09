import * as dsdk from "@monolayer/dsdk";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import invariant from "tiny-invariant";

/**
 * Creates a docker context
 */
export async function createContext(name: string, host: string, description: string) {
	const contexts = await listContexts();
	const exists = contexts.some((ctx) => ctx.Name === name);
	const buildOpts = [
		"context",
		exists ? "update" : "create",
		name,
		"--docker",
		`host=${host}`,
		"--description",
		description,
	];
	const build = spawn("docker", buildOpts);

	return new Promise<void>((resolve) => {
		build.on("close", (code) => {
			if (code !== 0) {
				throw new Error(`Docker context command exited with code ${code}`);
			}
			resolve();
		});
	});
}

/**
 * Removes a docker context
 */
export async function deleteContext(name: string) {
	const contexts = await listContexts();
	const exists = contexts.some((ctx) => ctx.Name === name);
	if (exists) {
		const build = spawn("docker", ["context", "rm", name]);

		return new Promise<void>((resolve) => {
			build.on("close", (code) => {
				if (code !== 0) {
					throw new Error(`Docker context command exited with code ${code}`);
				}
				resolve();
			});
		});
	} else {
		return new Promise<void>((resolve) => {
			resolve();
		});
	}
}

function listContexts() {
	const buildOpts = ["context", "ls", "--format", "json"];
	const build = spawn("docker", buildOpts);

	const contexts: DockerContext[] = [];
	build.stdout.on("data", (data) => {
		const lines = String(data)
			.split("\n")
			.filter((line: string) => line !== "");

		lines.map((line) => contexts.push(JSON.parse(line)));
	});

	build.stderr.on("data", (data) => {
		console.log("Error", data);
	});

	return new Promise<DockerContext[]>((resolve) => {
		build.on("close", (code) => {
			if (code !== 0) {
				throw new Error(`Docker context command exited with code ${code}`);
			}
			resolve(contexts);
		});
	});
}

interface DockerContext {
	Name: string;
	Description: string;
	DockerEndpoint: string;
	Current: boolean;
	Error: string;
	ContextType: string;
}

export type Require<S, T extends keyof S> = Required<Pick<S, T>> & Omit<S, T>;

export const appLabelKey = "com.blueprints.app";

export interface Service {
	name: string;
	id: string;
}

/**
 * Creates a service for the specified application.
 *
 * This function is idempotent (safe to call multiple times).
 * If the service already exists, the existing one will be returned without creating a new one.
 */
export async function createService(
	appName: string,
	networkName: string,
	serviceSpec: Require<dsdk.ServiceSpec, "Name" | "TaskTemplate" | "Mode">,
	registryAuthHeader?: RegistryAuthHeader,
) {
	const existingService = await fetchService(appName, serviceSpec.Name);

	const service: Service = { name: serviceSpec.Name, id: "" };

	if (existingService.length === 1) {
		invariant(existingService[0]?.ID, "missing service id");
		service.id = existingService[0].ID;
	} else {
		const response = await dsdk.serviceCreate({
			body: {
				...serviceSpec,
				Networks: [
					{
						Target: networkName,
					},
				],
				Labels: {
					...(serviceSpec.Labels ?? {}),
					[`${appLabelKey}`]: appName,
				},
			},
			headers: registryAuthHeader,
		});
		invariant(response.ID, "missing service id");
		service.id = response.ID;
	}
	return service;
}

/**
 * Creates or updates a service for the specified application.
 */
export async function createOrUpdateService(
	appName: string,
	networkName: string,
	serviceSpec: dsdk.ServiceSpec,
	registryAuthHeader: RegistryAuthHeader,
) {
	invariant(serviceSpec.Name, "expected serviceSpec.Name to be defined");

	const existingService = await fetchService(appName, serviceSpec.Name);

	const service: Service = { name: serviceSpec.Name, id: "" };

	const fullServiceSpec = {
		Networks: [{ Target: networkName }],
		...serviceSpec,
		Labels: {
			...(serviceSpec.Labels ?? {}),
			[`${appLabelKey}`]: appName,
		},
		UpdateConfig: {
			Parallelism: 1,
			FailureAction: "rollback",
			MaxFailureRatio: 0,
			Order: "start-first",
		},
		RollbackConfig: {
			Parallelism: 1,
			Order: "stop-first",
		},
	} satisfies dsdk.ServiceSpec;

	if (existingService.length === 1) {
		invariant(existingService[0]?.ID, "missing service id");
		invariant(existingService[0].Version?.Index, "missing service version");
		service.id = existingService[0].ID;
		await dsdk.serviceUpdate({
			path: { id: service.id },
			query: {
				version: existingService[0].Version.Index,
			},
			body: fullServiceSpec,
			headers: registryAuthHeader,
		});
	} else {
		const response = await dsdk.serviceCreate({
			body: fullServiceSpec,
			headers: registryAuthHeader,
		});
		invariant(response.ID, "missing service id");
		service.id = response.ID;
	}
	return service;
}

export async function fetchService(appName: string, serviceName: string) {
	return await dsdk.serviceList({
		query: {
			filters: JSON.stringify({
				label: [`${appLabelKey}=${appName}`],
				name: [serviceName],
			}),
		},
	});
}

interface CeateReplicatedJobOptions {
	/**
	 * Task configuration.
	 */
	taskSpec: dsdk.TaskSpec;
	/**
	 * The maximum number of replicas to run simultaneously.
	 *
	 * @defaultValue 0
	 */
	maxConcurrent?: number;
}

/**
 * Creates a service that will run as a job, running to completion and then stop.
 * When a Task belonging to a job exits successfully (return value 0),
 * the Task is marked as "Completed", and is not run again.
 *
 * **NOTE**
 *
 * The restart policy condition of the service will be set to `none`.
 */
export async function createReplicatedJob(
	name: string,
	options: CeateReplicatedJobOptions,
	registryAuthHeader: RegistryAuthHeader,
	appName: string,
	networkName: string,
) {
	return await createService(
		appName,
		networkName,
		{
			Name: name,
			TaskTemplate: {
				...options.taskSpec,
				RestartPolicy: {
					Condition: "none",
				},
			},
			Mode: { ReplicatedJob: { MaxConcurrent: options.maxConcurrent ?? 1 } },
		},
		registryAuthHeader,
	);
}

/** Streams service logs to `loggger`.
 *
 * Will run until the controller is aborted.
 */
export function streamLogs(serviceId: string) {
	const controller = new AbortController();
	dsdk.serviceLogs(
		{
			path: { id: serviceId },
			query: { follow: true, stderr: true, stdout: true },
			abortSignal: controller.signal,
		},
		(err, stdout, stderr) => {
			if (err) {
				controller.abort();
				throw err;
			}
			if (stdout) {
				console.log(stdout.toString());
			}
			if (stderr) {
				console.log(stderr.toString());
			}
		},
	);
	return controller;
}

export type CreateSwarmOptions = Omit<dsdk.SwarmInitData["body"], "ListenAddr" | "AdvertiseAddr">;

interface SwarmInfo {
	managerNodeId: string;
}

/**
 * Initializes a Docker swarm for the current application.
 *
 * This function is idempotent (safe to call multiple times).
 * If the swarm is already initialized, the existing one will be returned without creating a new one.
 *
 */
export async function initSwarm(
	appName: string,
	advertiseAddr: string,
	workerContexts: { name: string; ipAddr: string }[],
	options?: CreateSwarmOptions,
) {
	let managerNodeId = await fetchSwarm();

	if (!managerNodeId) {
		managerNodeId = await dsdk.swarmInit({
			body: {
				...(options ? options : {}),
				ListenAddr: advertiseAddr,
				AdvertiseAddr: advertiseAddr,
				Spec: {
					...(options?.Spec ? options.Spec : {}),
					Labels: {
						...(options?.Spec?.Labels ? options.Spec.Labels : {}),
						"com.blueprints.app": appName,
					},
				},
			},
		});
	}
	const inspect = await dsdk.swarmInspect({});

	const workerToken = inspect.JoinTokens?.Worker;
	invariant(workerToken, "undefined worker tokens");

	for (const context of workerContexts) {
		await dsdk.withContext(context.name, async () => {
			const info = await dsdk.systemInfo({});
			switch (info.Swarm?.LocalNodeState) {
				case "inactive":
					await dsdk.swarmJoin({
						body: {
							ListenAddr: context.ipAddr,
							AdvertiseAddr: context.ipAddr,
							RemoteAddrs: [`${advertiseAddr}:2377`],
							JoinToken: workerToken,
						},
					});
					break;
				case "error":
					throw new Error(`Worker LocalNodeState is error. Context name: ${context.name}`);
			}
		});
	}

	const swarm: SwarmInfo = { managerNodeId };
	return {
		...swarm,
		workerToken,
	};
}

async function fetchSwarm() {
	const info = await dsdk.systemInfo({});
	if (info.Swarm?.RemoteManagers !== null) {
		const nodeId = info.Swarm?.RemoteManagers?.at(0)?.NodeID;
		invariant(nodeId, "nodeId should be defined");
		return nodeId;
	}
	return;
}

/**
 * Returns the status of the first task in a service.
 */
async function taskStatus(serviceName: string) {
	const tasks = await dsdk.taskList({
		query: {
			filters: JSON.stringify({
				service: [serviceName],
			}),
		},
	});
	const sortedByVersion = tasks.sort((a, b) => {
		return Number(b.Version?.Index) - Number(a.Version?.Index);
	});
	const task = sortedByVersion[0];
	invariant(task, `Task ${serviceName} not found`);
	const status = task.Status;
	invariant(status, `Task ${serviceName} with undefined status`);

	return status;
}

/**
 * Waits until the status of the first task in a service is `running`.
 */
export async function waitUntilTaskIsRunning(serviceId: string, serviceName: string) {
	const status = await taskStatus(serviceName);
	switch (status.State) {
		case "rejected":
		case "failed":
			await dsdk.serviceDelete({ path: { id: serviceId } });
			throw new Error(`task failed: ${JSON.stringify(status)}`);
		case "complete":
		case "running":
			return;
		default:
			await setTimeout(1000);
			await waitUntilTaskIsRunning(serviceId, serviceName);
	}
}

/**
 * Waits until the status of the first task in a service is `complete`.
 */
export async function waitUntilTaskIsComplete(taskId: string) {
	const status = await taskStatus(taskId);

	switch (status.State) {
		case "running":
			await setTimeout(1000);
			return await waitUntilTaskIsComplete(taskId);
		case "complete":
			return status;
		default:
			await dsdk.serviceDelete({ path: { id: taskId } });
			throw new Error(`task failed: ${JSON.stringify(status)}`);
	}
}

interface RegistryAuthHeader {
	"X-Registry-Auth": string;
}

export function singleReplicaService(name: string, taskTemplate: dsdk.TaskSpec) {
	return {
		Name: name,
		TaskTemplate: taskTemplate,
		Mode: { Replicated: { Replicas: 1 } },
	};
}
