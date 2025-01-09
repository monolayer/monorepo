import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import invariant from "tiny-invariant";
import { associateResourceToStackProject } from "../../lib/associate-resources";
import { Config } from "../../lib/config";
import type { Compute } from "../compute";
import type { DockerSwarm } from "../docker-swarm";
import type { Project } from "../project";
import type { Vpc } from "../vpc";
import { LoadBalancer as LoadbalancerFactory } from "./factories/load-balancer";

export type SwarmLoadBalancerArgs = {
	mode: "vm-swarm";
	swarm: DockerSwarm;
};

export type DigitalOceanLoadBalancerArgs = {
	mode: "digitalocean-swarm";
	project: Project;
	vpc: Vpc;
	dropletsIds: pulumi.Output<string>[];
};

export type LoadBalancerArgs = SwarmLoadBalancerArgs | DigitalOceanLoadBalancerArgs;

export class LoadBalancer extends pulumi.ComponentResource {
	constructor(name: string, args: LoadBalancerArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:LoadBalancer", name, args, {
			...opts,
		});

		this.deployLoadBalancer(args);
	}

	deployLoadBalancer(args: LoadBalancerArgs) {
		switch (args.mode) {
			case "digitalocean-swarm":
				return digitalOceanLoadBalancer(args, this);
			case "vm-swarm":
				return swarmLoadBalancer(args, this);
		}
	}

	static newWithModeArgs(
		id: string,
		args: {
			swarm: DockerSwarm;
			vpc: Vpc;
			project: Project;
			compute: Compute;
		},
		opts?: pulumi.ComponentResourceOptions,
	) {
		const mode = Config.profileName;
		let loadBalancerArgs: LoadBalancerArgs | undefined = undefined;
		switch (mode) {
			case "vm-swarm":
				loadBalancerArgs = { mode, swarm: args.swarm };
				break;
			case "digitalocean-swarm":
				loadBalancerArgs = {
					mode,
					vpc: args.vpc,
					project: args.project,
					dropletsIds: args.compute.workers.map((w) => w.id),
				};
				break;
		}
		invariant(loadBalancerArgs);
		return new LoadBalancer(id, loadBalancerArgs, opts);
	}

	static createArgs(swarm: DockerSwarm, vpc: Vpc, project: Project, compute: Compute) {
		const mode = Config.profileName;
		let loadBalancerArgs: LoadBalancerArgs | undefined = undefined;
		switch (mode) {
			case "vm-swarm":
				loadBalancerArgs = { mode, swarm };
				break;
			case "digitalocean-swarm":
				loadBalancerArgs = {
					mode,
					vpc,
					project,
					dropletsIds: compute.workers.map((w) => w.id),
				};
				break;
		}
		invariant(loadBalancerArgs);
		return loadBalancerArgs;
	}
}

export function swarmLoadBalancer(args: SwarmLoadBalancerArgs, parent: pulumi.Resource) {
	const loadBalancerAdapter = LoadbalancerFactory.instance().adapter("swarm", {
		appName: Config.app.name,
		swarm: args.swarm,
	});
	loadBalancerAdapter.deploy(
		Config.domain,
		Config.appSubdomain,
		Config.vmSwarmProfile.acmeEmail,
		parent,
	);
}

export function digitalOceanLoadBalancer(
	args: DigitalOceanLoadBalancerArgs,
	parent: pulumi.Resource,
) {
	const domain = Config.domain;
	const subdomain = Config.appSubdomain;
	const certificate = new digitalocean.Certificate(
		"default",
		{
			type: "lets_encrypt",
			domains: [`${subdomain}.${domain}`],
		},
		{ parent },
	);

	const loadBalancerAdapter = LoadbalancerFactory.instance().adapter("digital-ocean", {
		project: args.project,
		vpc: args.vpc,
		region: Config.digitalOceanSwarmProfile.region,
	});
	const loadBalancer = loadBalancerAdapter.deploy(certificate, args.dropletsIds, parent);

	associateResourceToStackProject(
		"default-load-balancer",
		loadBalancer.loadBalancerUrn,
		args.project.project.id,
	);

	new digitalocean.DnsRecord(
		"load-balancer",
		{
			domain: domain,
			name: subdomain,
			ttl: 60,
			type: "A",
			value: loadBalancer.ip,
		},
		{ parent },
	);
}
