import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import { Compute } from "./components/compute";
import { Cron } from "./components/cron";
import { CronScheduler } from "./components/cron-scheduler";
import { DockerSwarm } from "./components/docker-swarm";
import { LoadBalancer } from "./components/load-balancer";
import { PrismaMigrate } from "./components/prisma-migrate";
import { Project } from "./components/project";
import { RegistryInfo } from "./components/registry-info";
import { StatefulWorkloads } from "./components/stateful-workloads";
import { Task } from "./components/task";
import { Vpc } from "./components/vpc";
import { WebApp } from "./components/web-app";
import { Config } from "./lib/config";

export = async () => {
	switch (pulumi.getStack()) {
		case "digitalocean-base":
			return digitalOceanDefaultStack();
		default:
			return environmentStack();
	}
};

function digitalOceanDefaultStack() {
	const config = new pulumi.Config("workloads");
	const projectName = pulumi.getProject();

	const project = new digitalocean.Project("default", { name: projectName });

	const domain = new digitalocean.Domain("default", { name: config.require("domain") });

	new digitalocean.ProjectResources("domain", {
		project: project.id,
		resources: [domain.domainUrn],
	});

	const registry = new digitalocean.ContainerRegistry("default", {
		name: projectName,
		subscriptionTierSlug: "basic",
	});

	return {
		project: { id: project.id, name: project.name },
		domain: { id: domain.id, name: domain.name },
		registry: {
			serverAddress: registry.serverUrl.apply((s) => `https://${s}`),
			name: pulumi
				.all([registry.serverUrl, registry.name])
				.apply(([serverUrl, name]) => `${serverUrl}/${name}`),
		},
	};
}

function environmentStack() {
	process.env["MONO_MAILER_APP_MAILER_URL"] = "smtps://";
	Config.checkEnvironmentVariables();

	const project = new Project("default", {});

	const vpc = new Vpc("default", { project });

	const compute = new Compute("default", { vpc, project });

	const swarm = new DockerSwarm("default", { compute }, { dependsOn: [vpc, compute] });

	LoadBalancer.newWithModeArgs("default", { swarm, vpc, project, compute });

	const registry = new RegistryInfo("default", { stackName: "digitalocean" });

	process.env["MONO_MAILER_APP_MAILER_URL"] = "smtps://";

	const statefulWorkloads = StatefulWorkloads.withModeArgs("default", { swarm, vpc, project });

	const baseArgs = { mode: "swarm" as const, registry, statefulWorkloads, swarm };

	const prismaMigrate = new PrismaMigrate("migrate-db", baseArgs);

	const tasks = Config.tasks.map(
		(task) => new Task(task.id, { task, ...baseArgs }, { dependsOn: [prismaMigrate] }),
	);

	new CronScheduler("default", { mode: "swarm", swarm });

	const crons = Config.crons.map(
		(cron) => new Cron(cron.id, { cron, ...baseArgs }, { dependsOn: [prismaMigrate] }),
	);

	const app = new WebApp("app", baseArgs, { dependsOn: [prismaMigrate] });

	return {
		projectId: project.project.id,
		vpc: vpc.vpc.id,
		swarmCompute: {
			manager: compute.manager,
			workers: compute.workers,
		},
		appUrl: `https://${Config.appSubdomain}.${Config.domain}`,
		app: app.imageName,
		crons: crons.map((c) => ({ id: c.cronId, imageName: c.imageName })),
		tasks: tasks.map((t) => ({ id: t.taskId, imageName: t.imageName })),
		prismaMigrate: prismaMigrate.imageName,
	};
}
