import * as pulumi from "@pulumi/pulumi";
import { DockerNetwork } from "../dynamic-resources/docker-network";
import { Swarm } from "../dynamic-resources/swarm";
import { SwarmWorker } from "../dynamic-resources/swarm-worker";
import { Config } from "../lib/config";
import type { Compute } from "./compute";

export interface DockerSwarmArgs {
	compute: Compute;
}

export class DockerSwarm extends pulumi.ComponentResource {
	swarm: Swarm;
	network: DockerNetwork;
	workers?: SwarmWorker[];

	constructor(name: string, args: DockerSwarmArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Swarm", name, args, opts);

		const appName = Config.app.name;

		this.swarm = new Swarm(
			"default",
			{
				appName,
				managerPublicIpAddr: args.compute.manager.ipv4Address,
				managerPrivateIpAddr: args.compute.manager.ipv4AddressPrivate,
				swarmOptions: {
					Spec: {
						Labels:
							Config.profileName === "vm-swarm"
								? {
										"traefik-public.traefik-public-certificates": "true",
									}
								: {},
					},
				},
			},
			{ ...opts, parent: this },
		);

		this.network = new DockerNetwork(
			"default",
			{
				appName,
				managerPublicIpAddr: args.compute.manager.ipv4Address,
			},
			{ parent: this, dependsOn: this.swarm },
		);

		const workers = args.compute.workers.map((w) => ({
			publicIpAddr: w.ipv4Address,
			privateIpAddr: w.ipv4AddressPrivate,
		}));
		workers.reduce<SwarmWorker[]>((acc, worker) => {
			const swarmWorker = new SwarmWorker(
				`worker-${acc.length}`,
				{
					managerIpv4Address: args.compute.manager.ipv4Address,
					managerIpv4AddressPrivate: args.compute.manager.ipv4AddressPrivate,
					workerIpv4Address: worker.publicIpAddr,
					workerIpv4AddressPrivate: worker.privateIpAddr,
					token: this.swarm.workerToken,
				},
				{
					parent: this.swarm,
					dependsOn: acc.length !== 0 ? [acc[acc.length - 1]!, this.swarm] : [this.swarm],
				},
			);
			acc.push(swarmWorker);
			return acc;
		}, []);

		this.registerOutputs({
			swarm: this.swarm,
			network: this.network,
			managerNodeId: this.swarm.managerNodeId,
			managerPublicIpAddr: this.swarm.managerPublicIpAddr,
			managerPrivateIpAddr: this.swarm.managerPrivateIpAddr,
			workerToken: this.swarm.workerToken,
			networkId: this.network.networkId,
			networkName: this.network.networkName,
		});
	}
}
