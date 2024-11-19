import { remember } from "@epic-web/remember";
import type { StartedTestContainer } from "testcontainers";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import {
	createMysqlDatabase,
	createPostgresDatabase,
} from "~sidecar/containers/admin/create-database.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { MySQLContainer } from "~sidecar/containers/mysql.js";
import { PostgreSQLContainer } from "~sidecar/containers/postgresql.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
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
			case "Bucket":
				assertBucket(workload);
				container = await this.startLocalStack(workload, initAfterLaunch);
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

	async startLocalStack(workload: Bucket, initialize: boolean) {
		const localStackContainer = await this.startLocalStackContainer();
		if (initialize) {
			await createBucket(workload.id, localStackContainer);
		}
		return localStackContainer.startedContainer;
	}

	#localStackContainer?: LocalStackContainer;

	async startLocalStackContainer() {
		if (this.#localStackContainer === undefined) {
			const localStackWorkload = new LocalStack("local-stack-testing");
			localStackWorkload.mode(this.mode);
			this.#localStackContainer = new LocalStackContainer(
				localStackWorkload,
				this.mode !== "test",
			);
			await this.#localStackContainer.start();
		}
		return this.#localStackContainer;
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);

function assertRedis<C>(workload: unknown): asserts workload is Redis<C> {}

function assertBucket(workload: unknown): asserts workload is Bucket {}

function assertPostgresDatabase<C>(
	workload: unknown,
): asserts workload is PostgresDatabase<C> {}

function assertMailer<C>(workload: unknown): asserts workload is Mailer<C> {}

function assertMySqlDatabase<C>(
	workload: unknown,
): asserts workload is MySqlDatabase<C> {}
