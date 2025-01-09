import type { DatabaseWorkloadInfo, WorkloadInfo } from "@monolayer/workloads";
import type { DatabaseCluster } from "@pulumi/digitalocean";
import type { Resource } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import { associateResourceToStackProject } from "../../lib/associate-resources";
import { Config } from "../../lib/config";
import type { Project } from "../project";
import type { Vpc } from "../vpc";
import { Elastic } from "./factories/elastic/elastic";
import { MongoDb } from "./factories/mongo/mongodb";
import { Mysql } from "./factories/mysql/mysql";
import { Postgres } from "./factories/postgres/postgres";
import { Redis } from "./factories/redis/redis";

export type DigitalOceanStatefulWorkloadsArgs = {
	mode: "digitalocean-swarm";
	vpc: Vpc;
	project: Project;
};

export function digitalOceanStatefulWorkloads(
	args: DigitalOceanStatefulWorkloadsArgs,
	parent: Resource,
) {
	const databaseClusters: {
		cluster: DatabaseCluster;
		credentials: pulumi.Output<string[]>;
	}[] = [];

	const resourceOptions = {
		retainOnDelete: Config.retainStateOnDelete,
		parent,
	};

	const manifest = Config.buildManifest;

	const options = {
		vpcId: args.vpc.vpc.id,
		region: Config.digitalOceanSwarmProfile.region,
		appName: Config.app.name,
	};

	const adapters = {
		postgresDatabase: Postgres.instance().adapter("digitalocean", options),
		redis: Redis.instance().adapter("digitalocean", options),
		mySqlDatabase: Mysql.instance().adapter("digitalocean", options),
		elasticSearch: Elastic.instance().adapter("digitalocean", options),
		mongoDb: MongoDb.instance().adapter("digitalocean", options),
	};

	Object.keys(adapters).map((k) => {
		const adapter = adapters[k as keyof typeof adapters];
		for (const wl of manifest[k as keyof typeof manifest]) {
			const workload = wl as unknown as DatabaseWorkloadInfo | WorkloadInfo;
			const cluster = adapter.deploy(workload.id, resourceOptions);
			const credentials = connectionStringCredentials(workload, cluster);
			databaseClusters.push({ cluster, credentials });
		}
	});

	if (manifest.task.length !== 0) {
		const workload = {
			id: "redis-tasks",
			connectionStringEnvVar: "MONO_TASK_REDIS_URL",
		};
		const cluster = adapters.redis.deploy(workload.id, resourceOptions);
		const credentials = connectionStringCredentials(workload, cluster);
		databaseClusters.push({ cluster, credentials });
	}

	databaseClusters.map((c) => {
		pulumi.all([c.cluster.id, c.cluster.clusterUrn]).apply(([clusterId]) => {
			associateResourceToStackProject(
				`${clusterId}-association`,
				c.cluster.clusterUrn,
				args.project.project.id,
				{
					parent: c.cluster,
				},
			);
		});
	});

	return databaseClusters.map((c) => c.credentials);
}

function connectionStringCredentials(
	workload: DatabaseWorkloadInfo | WorkloadInfo,
	cluster: DatabaseCluster,
) {
	if (isDatabaseWorkloadInfo(workload)) {
		return pulumi.all([cluster.privateUri, cluster.database]).apply(([uri, database]) =>
			workload.databases.flatMap((db) => {
				const credentials = `${db.connectionStringEnvVar}=${uri.replace(database, db.name)}`;
				return credentials;
			}),
		);
	} else {
		return pulumi
			.all([cluster.privateUri, cluster.database])
			.apply(([uri]) => [`${workload.connectionStringEnvVar}=${uri}`]);
	}
}

function isDatabaseWorkloadInfo(value: unknown): value is DatabaseWorkloadInfo {
	return (value as any).databases !== undefined;
}
