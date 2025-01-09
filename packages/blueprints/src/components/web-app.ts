import type { ServiceSpec } from "@monolayer/dsdk";
import * as pulumi from "@pulumi/pulumi";
import { Config, envVars } from "../lib/config";
import type { DockerSwarm } from "./docker-swarm";
import { FrameworkImage } from "./framework-image";
import type { RegistryInfo } from "./registry-info";
import type { StatefulWorkloads } from "./stateful-workloads";
import { StatelessWorkload } from "./stateless-workload";

export interface SwarmWebApp {
	mode: "swarm";
	swarm: DockerSwarm;
}

export type WebAppArgs = {
	registry: RegistryInfo;
	statefulWorkloads: StatefulWorkloads;
} & SwarmWebApp;

export class WebApp extends pulumi.ComponentResource {
	version: string;
	imageDigest: pulumi.Output<string> | undefined;
	imageRef: pulumi.Output<string> | undefined;
	imageName: pulumi.Output<string> | undefined;
	declare app: pulumi.Output<StatelessWorkload>;

	constructor(name: string, args: WebAppArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:WebApp", name, args, {
			...pulumi.mergeOptions(opts, { dependsOn: args.statefulWorkloads }),
		});

		const appImage = new FrameworkImage(
			Config.buildManifest.framework,
			{
				registry: args.registry,
			},
			{ parent: this },
		);

		this.version = Config.app.version;
		this.imageDigest = appImage.imageDigest;
		this.imageRef = appImage.imageRef;
		this.imageName = appImage.imageName;

		switch (Config.profileName) {
			case "digitalocean-swarm":
			case "vm-swarm":
				this.app = this.swarmWebApp(appImage, args);
				break;
		}

		name: this.imageName,
			this.registerOutputs({
				imageDigest: this.imageDigest,
				imageRef: this.imageRef,
				version: this.version,
				imageName: this.imageName,
				app: this.app,
			});
	}

	private swarmWebApp(appImage: FrameworkImage, args: WebAppArgs) {
		return appImage.imageName.apply(
			(name) =>
				new StatelessWorkload(
					"app",
					{
						mode: "swarm",
						name: "app",
						spec: this.appSpecForDeployMode(name, args.statefulWorkloads.credentials),
						registryAuth: args.registry.registryAuth(),
						swarm: args.swarm,
					},
					{ parent: this, dependsOn: appImage },
				),
		);
	}

	private appSpecForDeployMode(imageName: string, credentials: pulumi.Output<string[]>[]) {
		switch (Config.profileName) {
			case "vm-swarm":
				return this.appSpec(imageName, credentials, {
					Constraints: ["node.role == manager"],
				});
			case "digitalocean-swarm":
				return this.appSpec(
					imageName,
					credentials,
					{
						Constraints: ["node.role == worker"],
					},
					{
						Mode: "vip" as const,
						Ports: [
							{
								Protocol: "tcp" as const,
								TargetPort: 3000,
								PublishedPort: 80,
								PublishMode: "host" as const,
							},
						],
					},
				);
		}
	}

	private appSpec(
		imageName: string,
		credentials: pulumi.Output<string[]>[],
		placement: {
			Constraints: string[];
		},
		endpointSpec?: ServiceSpec["EndpointSpec"],
	) {
		return pulumi.all([credentials]).apply(([creds]) => {
			const env = envVars(creds);
			return {
				Name: "app",
				TaskTemplate: {
					ContainerSpec: {
						Image: imageName,
						...env,
						HealthCheck: {
							Test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000"],
							Interval: 10000 * 1000000,
							Timeout: 5000 * 1000000,
							Retries: 5,
							StartPeriod: 1000 * 1000000,
						},
					},
					Placement: placement,
				},
				Labels: Config.profileName === "vm-swarm" ? this.traeficLabels : undefined,
				Mode: { Replicated: { Replicas: 2 } },
				...(endpointSpec ? { EndpointSpec: endpointSpec } : {}),
			};
		});
		// return {
		// 	Name: "app",
		// 	TaskTemplate: {
		// 		ContainerSpec: {
		// 			Image: imageName,
		// 			...env,
		// 			HealthCheck: {
		// 				Test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000"],
		// 				Interval: 10000 * 1000000,
		// 				Timeout: 5000 * 1000000,
		// 				Retries: 5,
		// 				StartPeriod: 1000 * 1000000,
		// 			},
		// 		},
		// 		Placement: placement,
		// 	},
		// 	Labels: Config.profileName === "vm-swarm" ? this.traeficLabels : undefined,
		// 	Mode: { Replicated: { Replicas: 2 } },
		// 	...(endpointSpec ? { EndpointSpec: endpointSpec } : {}),
		// };
	}

	traeficLabels = {
		"traefik.enable": "true",
		"traefik.constraint-label": "app-traffic",
		"traefik.http.middlewares.admin-auth.basicauth.users":
			"marcessindi:$apr1$npAPxrLK$hKHH1RR1MoVdRmRNE6w8F0",
		"traefik.http.middlewares.https-redirect.redirectscheme.scheme": "https",
		"traefik.http.middlewares.https-redirect.redirectscheme.permanent": "true",
		"traefik.http.routers.app-traffic-http.service": "app-traffic",
		"traefik.http.routers.app-traffic-http.rule": `Host(\`${Config.appSubdomain}.${Config.domain}\`)`,
		"traefik.http.routers.app-traffic-http.entrypoints": "http",
		"traefik.http.routers.app-traffic-http.middlewares": "https-redirect",
		"traefik.http.routers.app-traffic-https.rule": `Host(\`${Config.appSubdomain}.${Config.domain}\`)`,
		"traefik.http.routers.app-traffic-https.entrypoints": "https",
		"traefik.http.routers.app-traffic-https.tls": "true",
		"traefik.http.routers.app-traffic-https.service": "app-traffic@swarm",
		"traefik.http.routers.app-traffic-https.middlewares": "admin-auth",
		"traefik.http.services.app-traffic.loadbalancer.server.port": "3000",
		"traefik.http.routers.app-traffic-https.tls.certresolver": "le",
	};
}
