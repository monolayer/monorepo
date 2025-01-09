import { xRegistryAuth } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { Config } from "../lib/config";

interface RegistryOutput {
	name: string;
	serverAddress: string;
}

export interface RegistryInfoArgs {
	stackName: string;
}

export class RegistryInfo extends pulumi.ComponentResource {
	declare readonly name: pulumi.Output<string>;
	declare readonly serverAddress: pulumi.Output<string>;

	constructor(name: string, args: RegistryInfoArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:RegistryInfo", name, args, {
			...opts,
			replaceOnChanges: ["serverAddress", "name"],
		});

		const registry = this.fetchRegistryInfo(args.stackName);
		this.name = registry.apply((r) => r.name);
		this.serverAddress = registry.apply((r) => r.serverAddress);
		this.registerOutputs({ name: this.name, serverAddress: this.serverAddress });
	}

	fetchRegistryInfo(stackName: string) {
		switch (Config.profileName) {
			case "digitalocean-swarm":
				return new pulumi.StackReference(
					`${pulumi.getOrganization()}/${pulumi.getProject()}/${stackName}`,
				).getOutput("registry") as pulumi.Output<RegistryOutput>;
			case "vm-swarm":
				return pulumi.output({
					name: Config.vmSwarmProfile.registry.name,
					serverAddress: Config.vmSwarmProfile.registry.serverAddress,
				});
			default:
				throw new pulumi.RunError(`Profile not supported: ${Config.profileName}`);
		}
	}

	applyInfo<T>(fn: (info: Info) => T) {
		return pulumi
			.all([this.name, this.serverAddress, Config.registryUsername, Config.registryPassword])
			.apply(([name, serverAddress, username, password]) => {
				const info = {
					name,
					serverAddress,
					username,
					password,
				};
				return fn({ ...info, registryAuth: xRegistryAuth(info)["X-Registry-Auth"] });
			});
	}

	registryAuth() {
		return pulumi
			.all([this.name, this.serverAddress, Config.registryUsername, Config.registryPassword])
			.apply(([name, serverAddress, username, password]) => {
				const info = {
					name,
					serverAddress,
					username,
					password,
				};
				return xRegistryAuth(info)["X-Registry-Auth"];
			});
	}
}

export interface Info {
	name: string;
	serverAddress: string;
	username: string;
	password: string;
	registryAuth: string;
}
