import * as dockerBuild from "@pulumi/docker-build";
import type { CustomResourceOptions } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
export interface DockerBuildConfig {}

interface BuildOptions {
	registry: {
		username: string;
		password: string;
		serverAddress: string;
	};
}

interface DockerBuildOpts {
	imageName: pulumi.Input<string>;
	dockerFile: pulumi.Input<string>;
	platforms: pulumi.Input<pulumi.Input<dockerBuild.Platform>[]>;
	registry: pulumi.Input<dockerBuild.types.input.RegistryArgs>;
	context: pulumi.Input<string>;
}

export class DockerBuild {
	buildAndPush(name: string, options: DockerBuildOpts, opts?: CustomResourceOptions) {
		return new dockerBuild.Image(
			name,
			{
				tags: [options.imageName],
				dockerfile: {
					location: options.dockerFile,
				},
				context: { location: options.context },
				platforms: options.platforms,
				push: true,
				registries: [options.registry],
			},
			{ ...opts, retainOnDelete: true },
		);
	}
}
