import * as command from "@pulumi/command";
import * as digitalocean from "@pulumi/digitalocean";
import type { Resource } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";
import type { ComputeArgs } from ".";
import { associateResourceToStackProject } from "../../lib/associate-resources";
import { Config } from "../../lib/config";
import { createContext } from "../../lib/docker-objects";

export function digitalOceanSwarmCompute(args: ComputeArgs, parent: Resource) {
	const defaultKey = new digitalocean.SshKey(
		"default",
		{
			name: "default-ssh-key",
			publicKey: Config.sshKey,
		},
		{ parent },
	);

	const initPrivateKey = new tls.PrivateKey(
		"init-sshKey",
		{
			algorithm: "RSA",
			rsaBits: 4096,
		},
		{ parent },
	);

	const initKey = new digitalocean.SshKey(
		"init",
		{
			publicKey: initPrivateKey.publicKeyOpenssh,
		},
		{ parent },
	);

	const region = Config.digitalOceanSwarmProfile.region;
	const managerDroplet = defaultDroplet(
		{
			name: "manager",
			vpcUuid: args.vpc.vpc.id,
			sshKeys: [defaultKey.id, initKey.id],
			tags: ["manager-node"],
		},
		args.project.project.id,
		region,
		{ initPrivateKey: initPrivateKey, pulumiResourceOptions: { parent } },
	);

	const workers = Array.from(Array(Config.digitalOceanSwarmProfile.workerNodes)).map((_, i) => `worker${i + 1}`);

	const workerDroplets = workers.map((workerName) =>
		defaultDroplet(
			{
				name: workerName,
				vpcUuid: args.vpc.vpc.id,
				monitoring: true,
				sshKeys: [defaultKey.id, initKey.id],
				tags: ["worker-node"],
			},
			args.project.project.id,
			region,
			{ initPrivateKey: initPrivateKey, pulumiResourceOptions: { parent } },
		),
	);

	const allDroplets = [managerDroplet.droplet, ...workerDroplets.map((d) => d.droplet)].filter(
		(e) => e !== undefined,
	);

	sshFirewall(allDroplets);
	webFirewall(allDroplets);
	swarmFirewall(allDroplets);

	return {
		manager: {
			ipv4Address: managerDroplet.droplet.ipv4Address,
			ipv4AddressPrivate: managerDroplet.droplet.ipv4AddressPrivate,
			id: managerDroplet.droplet.id,
		},
		workers: workerDroplets.map((d) => ({
			ipv4Address: d.droplet.ipv4Address,
			ipv4AddressPrivate: d.droplet.ipv4AddressPrivate,
			id: d.droplet.id,
		})),
	};
}

function defaultDroplet(
	createArgs: Partial<digitalocean.DropletArgs>,
	projectId: pulumi.Output<string>,
	region: string,
	opts: {
		initPrivateKey: tls.PrivateKey;
		pulumiResourceOptions?: pulumi.CustomResourceOptions;
	},
) {
	const dropletArgs = {
		image: "ubuntu-22-04-x64",
		size: digitalocean.DropletSlug.DropletS1VCPU1GB_INTEL,
		region: region,
		monitoring: true,
		backups: true,
		userData: userData(),
		...createArgs,
	};
	const droplet = new digitalocean.Droplet(
		String(dropletArgs.name),
		dropletArgs,
		opts.pulumiResourceOptions,
	);
	const dropletCloudInit = cloudInitWait(
		`wait-cloud-init-${dropletArgs.name}`,
		droplet,
		opts.initPrivateKey,
		opts.pulumiResourceOptions,
	);

	associateResourceToStackProject(
		droplet.id.apply((id) => `droplet-${id}`),
		droplet.dropletUrn,
		projectId,
		opts.pulumiResourceOptions,
	);

	const context = droplet.ipv4Address.apply(async (ipAddr) => {
		const contextName = `${stackProject()}-${dropletArgs.name}`;
		await createContext(contextName, `ssh://root@${ipAddr}`, "Digital Ocean");
		return contextName;
	});

	return { droplet, dropletCloudInit, context };
}

function sshFirewall(droplets: digitalocean.Droplet[]) {
	return new digitalocean.Firewall("ssh", {
		name: "allow-ssh-trafic",
		inboundRules: [{ protocol: "tcp", portRange: "22", sourceAddresses: ["0.0.0.0/0", "::/0"] }],
		outboundRules: [
			{ protocol: "icmp", destinationAddresses: ["0.0.0.0/0", "::/0"] },
			{ protocol: "tcp", portRange: "all", destinationAddresses: ["0.0.0.0/0", "::/0"] },
			{ protocol: "udp", portRange: "all", destinationAddresses: ["0.0.0.0/0", "::/0"] },
		],
		dropletIds: droplets.map((droplet) => droplet.id.apply(parseInt)),
	});
}

function webFirewall(droplets: digitalocean.Droplet[]) {
	return new digitalocean.Firewall("web", {
		name: "allow-web-trafic",
		inboundRules: [
			{ protocol: "tcp", portRange: "80", sourceAddresses: ["0.0.0.0/0", "::/0"] },
			{ protocol: "tcp", portRange: "443", sourceAddresses: ["0.0.0.0/0", "::/0"] },
		],
		outboundRules: [
			{ protocol: "icmp", destinationAddresses: ["0.0.0.0/0", "::/0"] },
			{ protocol: "tcp", portRange: "all", destinationAddresses: ["0.0.0.0/0", "::/0"] },
			{ protocol: "udp", portRange: "all", destinationAddresses: ["0.0.0.0/0", "::/0"] },
		],
		dropletIds: droplets.map((droplet) => droplet.id.apply(parseInt)),
	});
}

function swarmFirewall(droplets: digitalocean.Droplet[]) {
	const ipRange = Config.digitalOceanSwarmProfile.vpcIpRange;

	return new digitalocean.Firewall("swarm", {
		name: "allow-swarm-trafic",
		inboundRules: [
			{ protocol: "tcp", portRange: "2377", sourceAddresses: [ipRange] },
			{ protocol: "tcp", portRange: "7946", sourceAddresses: [ipRange] },
		],
		outboundRules: [
			{ protocol: "tcp", portRange: "all", destinationAddresses: ["0.0.0.0/0", "::/0"] },
		],
		dropletIds: droplets.map((droplet) => droplet.id.apply(parseInt)),
	});
}

function cloudInitWait(
	name: string,
	droplet: digitalocean.Droplet,
	privateKey: tls.PrivateKey,
	pulumiResourceOptions?: pulumi.CustomResourceOptions,
) {
	return new command.remote.Command(
		name,
		{
			connection: {
				host: droplet.ipv4Address,
				user: "root",
				privateKey: privateKey.privateKeyPem,
				dialErrorLimit: 20,
			},
			create: "cloud-init status --wait",
		},
		pulumiResourceOptions,
	);
}

function stackProject() {
	return `${pulumi.getProject()}-${pulumi.getStack()}`;
}

function userData() {
	return `\
#!/bin/bash

# Allow only SSH
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH

# Add Docker's official GPG key
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y

# Install Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
`;
}
