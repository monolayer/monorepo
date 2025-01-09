import { remote, types } from "@pulumi/command";
import type { Resource } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import type { ComputeArgs } from ".";
import { Config } from "../../lib/config";

export function bareSwarmCompute(args: ComputeArgs, parent: Resource) {
	const connection: types.input.remote.ConnectionArgs = {
		host: Config.vmSwarmProfile.ipv4Address,
		user: "root",
	};

	new remote.Command(
		"install-docker",
		{
			connection,
			create: installDocker(),
		},
		{ parent },
	);

	return {
		manager: {
			ipv4Address: pulumi.output(Config.vmSwarmProfile.ipv4Address),
			ipv4AddressPrivate: pulumi.output(Config.vmSwarmProfile.ipv4AddressPrivate),
			id: pulumi.output(""),
		},
		workers: [] as {
			ipv4Address: pulumi.Output<string>;
			ipv4AddressPrivate: pulumi.Output<string>;
			id: pulumi.Output<string>;
		}[],
	};
}

function installDocker() {
	return `\
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
