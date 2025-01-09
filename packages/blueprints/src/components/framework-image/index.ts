import * as dockerBuild from "@pulumi/docker-build";
import * as pulumi from "@pulumi/pulumi";
import path from "node:path";
import { Config } from "../../lib/config";
import type { RegistryInfo } from "../registry-info";
import { FrameworkDockerfile } from "./factories/framework-dockerfile";
import { Images } from "./factories/image/image";

export interface FrameworkImageArgs {
	registry: RegistryInfo;
}

export class FrameworkImage extends pulumi.ComponentResource {
	imageName: pulumi.Output<string>;
	imageDigest: pulumi.Output<string> | undefined;
	imageRef: pulumi.Output<string> | undefined;

	constructor(name: string, args: FrameworkImageArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:FrameworkImage", name, args, {
			...opts,
		});

		const appDockerfilePath = path.join(Config.app.root, ".workloads/app.Dockerfile");
		FrameworkDockerfile.instance().adapter("nextjs").dockerfile().save(appDockerfilePath);

		const imagesAdapter = Images.instance().adapter("docker-build");

		this.imageName = args.registry.name.apply((n) => `${n}/app:${Config.app.version}`);

		const image = imagesAdapter.buildAndPush(
			`app:${Config.app.version}`,
			{
				imageName: this.imageName,
				dockerFile: appDockerfilePath,
				platforms: pulumi.output(Config.dockerBuildPlatforms as dockerBuild.Platform[]),
				context: Config.app.root,
				registry: {
					username: Config.registryUsername,
					password: Config.registryPassword,
					address: args.registry.serverAddress,
				},
			},
			{ parent: this },
		);

		this.registerOutputs({
			image: image,
			name: this.imageName,
			imageRef: image.ref,
			imageDigest: image.digest,
		});
	}
}
