import { remember } from "@epic-web/remember";
import type { StartedTestContainer } from "testcontainers";
import {
	assertBucket,
	assertElasticSearch,
	assertMailer,
	assertMongoDb,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/containers/admin/assertions.js";
import {
	createMysqlDatabase,
	createPostgresDatabase,
} from "~workloads/containers/admin/create-database.js";
import { ElasticSearchContainer } from "~workloads/containers/elastic-search.js";
import { LocalStackContainer } from "~workloads/containers/local-stack.js";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { MongoDbContainer } from "~workloads/containers/mongo-db.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import type { Bucket } from "~workloads/workloads/stateful/bucket.js";
import type { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";
import type { Mailer } from "~workloads/workloads/stateful/mailer.js";
import type { MongoDb } from "~workloads/workloads/stateful/mongo-db.js";
import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import type { Redis } from "~workloads/workloads/stateful/redis.js";
import type { Workload } from "~workloads/workloads/workload.js";

class ContainerStarter {
	mode: "dev" | "test" = "dev";

	async startContainerForWorkload(
		workload: Workload,
		options: {
			initialize?: boolean;
			mode: "dev" | "test";
		},
	) {
		this.mode = options.mode;
		workload.mode(this.mode);
		const initAfterLaunch = options.initialize ?? false;

		let container: StartedTestContainer | undefined = undefined;
		switch (workload.constructor.name) {
			case "Redis":
				assertRedis(workload);
				container = await this.startRedis(workload);
				break;
			case "Mailer":
				assertMailer(workload);
				container = await this.startMailer(workload);
				break;
			case "MySqlDatabase":
				assertMySqlDatabase(workload);
				container = await this.startMySql(workload, initAfterLaunch);
				break;
			case "PostgresDatabase":
				assertPostgresDatabase(workload);
				container = await this.startPostgres(workload, initAfterLaunch);
				break;
			case "ElasticSearch":
				assertElasticSearch(workload);
				container = await this.startElasticSearch(workload);
				break;
			case "MongoDb":
				assertMongoDb(workload);
				container = await this.startMongoDb(workload);
				break;
			case "Bucket":
				assertBucket(workload);
				container = await this.startLocalStack(workload);
				break;
		}
		return container;
	}

	async startRedis<C>(workload: Redis<C>) {
		const container = new RedisContainer(workload);
		return await container.start();
	}

	async startPostgres<C>(workload: PostgresDatabase<C>, initialize: boolean) {
		const container = new PostgreSQLContainer(workload);
		const startedContainer = await container.start();
		if (initialize) {
			await createPostgresDatabase(workload);
		}
		return startedContainer;
	}

	async startMySql<C>(workload: MySqlDatabase<C>, initialize: boolean) {
		const container = new MySQLContainer(workload);
		const startedContainer = await container.start();
		if (initialize) {
			await createMysqlDatabase(workload);
		}
		return startedContainer;
	}

	async startMailer<C>(workload: Mailer<C>) {
		const container = new MailerContainer(workload);
		return await container.start();
	}

	async startElasticSearch<C>(workload: ElasticSearch<C>) {
		const container = new ElasticSearchContainer(workload);
		return await container.start();
	}

	async startMongoDb<C>(workload: MongoDb<C>) {
		const container = new MongoDbContainer(workload);
		return await container.start();
	}

	async startLocalStack<C>(workload: Bucket<C>) {
		const container = new LocalStackContainer(workload);
		return await container.start();
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
