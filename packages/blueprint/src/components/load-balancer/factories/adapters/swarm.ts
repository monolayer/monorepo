import type { ServiceSpec, TaskSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { ReplicatedService } from "../../../../dynamic-resources/replicated-service";
import { singleReplicaService, type Require } from "../../../../lib/docker-objects";
import type { DockerSwarm } from "../../../docker-swarm";

export interface SwarmConfig {
	appName: string;
	swarm: DockerSwarm;
}

export class Swarm {
	constructor(public config: SwarmConfig) {}

	deploy(domain: string, appSubdomain: string, acmeEmail: string, parent: pulumi.Resource) {
		const spec: Require<ServiceSpec, "Name" | "TaskTemplate" | "Mode"> = {
			...singleReplicaService(
				"traefik",
				traefikSpec(
					this.config.appName,
					acmeEmail,
					`${appSubdomain}.${domain}`,
					`traefik.${domain}`,
				),
			),
			EndpointSpec: {
				Ports: [
					{
						Protocol: "tcp",
						TargetPort: 80,
						PublishedPort: 80,
						PublishMode: "host",
					},
					{
						Protocol: "tcp",
						TargetPort: 443,
						PublishedPort: 443,
						PublishMode: "host",
					},
				],
			},
		};
		return new ReplicatedService(
			"traefik",
			{
				appName: this.config.appName,
				networkName: this.config.swarm.network.networkName,
				serviceSpec: spec,
				registryAuth: "",
				managerPublicIpAddr: this.config.swarm.swarm.managerPublicIpAddr,
			},
			{
				parent: parent,
				dependsOn: [this.config.swarm.network, this.config.swarm.swarm],
			},
		);
	}
}

const traefikSpec = (
	appName: string,
	acmeEmail: string,
	appDomain: string,
	adminDomain: string,
) => {
	return {
		ContainerSpec: {
			Image: `traefik:v3.2`,
			Command: [
				"traefik",
				"--providers.swarm",
				"--providers.docker.useBindPortIP=true",
				"--providers.swarm.useBindPortIP=true",
				`--providers.swarm.network=${appName}-network`,
				// `--providers.docker.network=${appName}-network`,
				"--providers.swarm.constraints=Label(`traefik.constraint-label`, `app-traffic`)",
				"--providers.docker.exposedbydefault=false",
				"--providers.swarm.exposedbydefault=false",
				"--providers.swarm.endpoint=unix:///var/run/docker.sock",
				"--entrypoints.http.address=:80",
				"--entrypoints.https.address=:443",
				`--certificatesresolvers.le.acme.email=${acmeEmail}`,
				"--certificatesresolvers.le.acme.storage=/certificates/acme.json",
				"--certificatesresolvers.le.acme.tlschallenge=true",
				"--accesslog",
				"--log",
				"--api",
			],
			Labels: {
				"traefik.enable": "true",
				"traefik.swarm.network": `${appName}-network`,
				// "traefik.docker.network": `${appName}-network`,
				"traefik.http.middlewares.admin-auth.basicauth.users":
					"marcessindi:$apr1$npAPxrLK$hKHH1RR1MoVdRmRNE6w8F0",
				"traefik.http.middlewares.https-redirect.redirectscheme.scheme": "https",
				"traefik.http.middlewares.https-redirect.redirectscheme.permanent": "true",
				"traefik.http.routers.dashboard-http.rule": `Host(\`${adminDomain}\`)`,
				"traefik.http.routers.dashboard-http.entrypoints": "http",
				"traefik.http.routers.dashboard-http.service": "api@internal",
				"traefik.http.routers.dashboard-http.middlewares": "https-redirect",
				"traefik.http.routers.dashboard-https.rule": `Host(\`${adminDomain}\`)`,
				"traefik.http.routers.dashboard-https.entrypoints": "https",
				"traefik.http.routers.dashboard-https.tls": "true",
				"traefik.http.routers.dashboard-https.service": "api@internal",
				"traefik.http.routers.dashboard-https.middlewares": "admin-auth",
				"traefik.http.routers.dashboard-https.tls.certresolver": "le",
			},
			Mounts: [
				{
					Type: "bind",
					Source: "/var/run/docker.sock",
					Target: "/var/run/docker.sock",
					ReadOnly: true,
				},
				{
					Type: "volume",
					Source: "traefik-public-certificates",
					Target: "/certificates",
				},
			],
		},
		RestartPolicy: {
			Condition: "none",
		},
		Placement: {
			Constraints: ["node.role == manager"],
		},
	} satisfies TaskSpec as TaskSpec;
};
