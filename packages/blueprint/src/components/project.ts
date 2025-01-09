import * as digitalocean from "@pulumi/digitalocean";
import * as pulumiNull from "@pulumi/null";
import * as pulumi from "@pulumi/pulumi";
import { Config } from "../lib/config";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProjectArgs {}

export class Project extends pulumi.ComponentResource {
	project: digitalocean.Project | pulumiNull.Resource;

	constructor(name: string, args: ProjectArgs, opts?: pulumi.ComponentResourceOptions) {
		super("workloads:index:Project", name, args, {
			...opts,
		});
		this.project = this.deployProject();
	}

	private deployProject() {
		const projectName = Config.app.name;
		switch (Config.profileName) {
			case "digitalocean-swarm":
				return this.digitalOceanProject(projectName);
			case "vm-swarm":
				return this.nullProject(projectName);
		}
	}

	private digitalOceanProject(name: string) {
		return new digitalocean.Project(
			"default",
			{
				name: name,
			},
			{ parent: this },
		);
	}

	private nullProject(name: string) {
		return new pulumiNull.Resource(
			"project",
			{
				triggers: {
					projectName: name,
				},
			},
			{ parent: this },
		);
	}
}
