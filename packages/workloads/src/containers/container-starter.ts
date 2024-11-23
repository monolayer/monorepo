import { remember } from "@epic-web/remember";
import {
	assertBucket,
	assertElasticSearch,
	assertMailer,
	assertMongoDb,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/containers/admin/assertions.js";
import { ElasticSearchContainer } from "~workloads/containers/elastic-search.js";
import { LocalStackContainer } from "~workloads/containers/local-stack.js";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { MongoDbContainer } from "~workloads/containers/mongo-db.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import type { Workload } from "~workloads/workloads/workload.js";

class ContainerStarter {
	async startForWorload(
		workload: Workload,
		options: {
			mode: "dev" | "test";
			waitForHealthcheck: boolean;
		},
	) {
		const container = this.workloadContainer(workload);
		container.mode = options.mode;
		return await container.start(options.waitForHealthcheck);
	}

	private workloadContainer(workload: Workload) {
		switch (workload.constructor.name) {
			case "Redis":
				assertRedis(workload);
				return new RedisContainer(workload);
			case "Mailer":
				assertMailer(workload);
				return new MailerContainer(workload);
			case "MySqlDatabase":
				assertMySqlDatabase(workload);
				return new MySQLContainer(workload);
			case "PostgresDatabase":
				assertPostgresDatabase(workload);
				return new PostgreSQLContainer(workload);
			case "ElasticSearch":
				assertElasticSearch(workload);
				return new ElasticSearchContainer(workload);
			case "MongoDb":
				assertMongoDb(workload);
				return new MongoDbContainer(workload);
			case "Bucket":
				assertBucket(workload);
				return new LocalStackContainer(workload);
			default:
				throw new Error(`Missing container for ${workload.constructor.name}`);
		}
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
