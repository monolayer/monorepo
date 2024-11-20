import { remember } from "@epic-web/remember";
import type { StartedTestContainer } from "testcontainers";
import {
	createMysqlDatabase,
	createPostgresDatabase,
} from "~sidecar/containers/admin/create-database.js";
import { ElasticSearchContainer } from "~sidecar/containers/elastic-search.js";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { MySQLContainer } from "~sidecar/containers/mysql.js";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { ElasticSearch } from "~sidecar/workloads/stateful/elastic-search.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";
import type { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import type { Redis } from "~sidecar/workloads/stateful/redis.js";
import type { Workload } from "~sidecar/workloads/workload.js";

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
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);

function assertRedis<C>(workload: unknown): asserts workload is Redis<C> {}

function assertElasticSearch<C>(
	workload: unknown,
): asserts workload is ElasticSearch<C> {}

function assertPostgresDatabase<C>(
	workload: unknown,
): asserts workload is PostgresDatabase<C> {}

function assertMailer<C>(workload: unknown): asserts workload is Mailer<C> {}

function assertMySqlDatabase<C>(
	workload: unknown,
): asserts workload is MySqlDatabase<C> {}
