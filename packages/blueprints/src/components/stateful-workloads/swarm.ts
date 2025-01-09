import type { BuildManifest, DatabaseWorkloadInfo, WorkloadInfo } from "@monolayer/workloads";
import type { Resource } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import type { ReplicatedService } from "../../dynamic-resources/replicated-service";
import { Config } from "../../lib/config";
import type { DockerSwarm } from "../docker-swarm";
import { Elastic } from "./factories/elastic/elastic";
import { MongoDb } from "./factories/mongo/mongodb";
import { Mysql } from "./factories/mysql/mysql";
import { Postgres } from "./factories/postgres/postgres";
import { Redis } from "./factories/redis/redis";

export type SwarmStatefulWorkloadArgs = {
	mode: "vm-swarm";
	swarm: DockerSwarm;
};

export function swarmStatefulWorkloads(swarm: DockerSwarm, parent: Resource) {
	const services: {
		service: ReplicatedService;
		credentials: pulumi.Output<string[]>;
	}[] = [];

	const options = {
		appName: Config.app.name,
		manifest: Config.buildManifest,
		swarm: swarm.swarm,
	};

	const adapters = {
		postgresDatabase: Postgres.instance().adapter("swarm", options),
		redis: Redis.instance().adapter("swarm", options),
		mySqlDatabase: Mysql.instance().adapter("swarm", options),
		elasticSearch: Elastic.instance().adapter("swarm", options),
		mongoDb: MongoDb.instance().adapter("swarm", options),
	};

	Object.keys(adapters).map((k) => {
		const adapter = adapters[k as keyof typeof adapters];
		const key = k as keyof typeof options.manifest;
		for (const wl of options.manifest[key]) {
			const workload = wl as unknown as DatabaseWorkloadInfo | WorkloadInfo;
			const service = adapter.deploy(workload.id, swarm, { parent });
			const credentials = connectionStringCredentials(workload, key);
			const output: pulumi.Output<string[]> = pulumi.output(credentials);
			services.push({ service, credentials: output });
		}
	});

	if (options.manifest.task.length !== 0) {
		const workload = {
			id: "redis-tasks",
			connectionStringEnvVar: "MONO_TASK_REDIS_URL",
		};
		const service = adapters.redis.deploy(workload.id, swarm, { parent });
		const credentials = connectionStringCredentials(workload, "redis");
		const output: pulumi.Output<string[]> = pulumi.output(credentials);
		services.push({ service, credentials: output });
	}
	return services.map((s) => s.credentials);
}

function connectionStringCredentials(
	workload: DatabaseWorkloadInfo | WorkloadInfo,
	kind: keyof BuildManifest,
) {
	switch (kind) {
		case "postgresDatabase":
			assertDatabaseWorkloadInfo(workload);
			return workload.databases.map(
				(db) => `${db.connectionStringEnvVar}=${postgresUrl(db.serverId, db.name)}`,
			);
		case "mySqlDatabase":
			assertDatabaseWorkloadInfo(workload);
			return workload.databases.map(
				(db) => `${db.connectionStringEnvVar}=${mysqlUrl(db.serverId, db.name)}`,
			);
		case "mongoDb":
			assertDatabaseWorkloadInfo(workload);
			return workload.databases.map(
				(db) => `${db.connectionStringEnvVar}=${mongoUrl(db.serverId, db.name)}`,
			);
		case "redis":
			assertWorkloadInfo(workload);
			return [`${workload.connectionStringEnvVar}=${redisUrl(workload.id)}`];
		case "elasticSearch":
			assertWorkloadInfo(workload);
			return [`${workload.connectionStringEnvVar}=${elasticSearchUrl(workload.id)}`];
		default:
			throw new Error(`Unsuported workload ${kind}`);
	}
}

function postgresUrl(hostName: string, databaseName: string) {
	const url = new URL("", "postgres://");
	url.hostname = hostName;
	url.port = String(5432);
	url.username = "postgres";
	url.password = "postgres";
	url.pathname = databaseName;
	return url.toString();
}

function redisUrl(hostName: string) {
	const url = new URL("", "redis://");
	url.hostname = hostName;
	url.port = String(6379);
	return url.toString();
}

function mysqlUrl(hostName: string, databaseName: string) {
	const url = new URL("", "mysql://");
	url.hostname = hostName;
	url.port = String(3306);
	url.username = "root";
	url.password = "test";
	url.pathname = databaseName;
	return url.toString();
}

function mongoUrl(hostName: string, databaseName: string) {
	const url = new URL("", "http://base.com");
	url.hostname = hostName;
	url.port = String(27017);
	url.pathname = databaseName;
	return url.toString();
}

function elasticSearchUrl(hostName: string) {
	const url = new URL("", "http://base.com");
	url.hostname = hostName;
	url.port = String(9200);
	return url.toString();
}

function assertDatabaseWorkloadInfo(value: unknown): asserts value is DatabaseWorkloadInfo {}
function assertWorkloadInfo(value: unknown): asserts value is WorkloadInfo {}
