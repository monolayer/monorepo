import { remember } from "@epic-web/remember";
import { type StartedTestContainer } from "testcontainers";
import { PostgreSQLContainer, type StartOptions } from "~sidecar/containers.js";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { createDatabase } from "~sidecar/containers/admin/create-database.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { MySQLContainer } from "~sidecar/containers/mysql.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";
import type { MySqlDatabase } from "~sidecar/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import type { Redis } from "~sidecar/workloads/stateful/redis.js";

function isRedis<C>(workload: unknown): workload is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "Redis";
}

function isBucket(workload: unknown): workload is Bucket {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "Bucket";
}

function isPostgresDatabase<C>(
	workload: unknown,
): workload is PostgresDatabase<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "PostgresDatabase";
}

function isMailer<C>(workload: unknown): workload is Mailer<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "Mailer";
}

function isMysql<C>(workload: unknown): workload is MySqlDatabase<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "MySqlDatabase";
}

class ContainerStarter {
	async startContainerForWorkload(
		workload: unknown,
		options?: {
			startOptions?: StartOptions;
			initialize?: boolean;
		},
	) {
		if (isRedis(workload)) {
			return await this.startRedis(workload, options?.startOptions);
		}
		if (isBucket(workload)) {
			const localStackContainer = await this.startLocalStack();
			if (options?.initialize) {
				await createBucket(workload.id, localStackContainer);
			}
			return localStackContainer.startedContainer;
		}
		if (isPostgresDatabase(workload)) {
			let container: StartedTestContainer | undefined = undefined;
			container = await this.startPostgres(workload, options?.startOptions);
			if (options?.initialize) {
				await createDatabase(workload);
			}
			return container;
		}
		if (isMailer(workload)) {
			return await this.startMailer(workload, options?.startOptions);
		}
		if (isMysql(workload)) {
			return await this.startMySql(workload, options?.startOptions);
		}
	}

	async startRedis<C>(workload: Redis<C>, options?: StartOptions) {
		const container = new RedisContainer(workload);
		return await container.start(options);
	}

	async startPostgres<C>(
		workload: PostgresDatabase<C>,
		options?: StartOptions,
	) {
		const container = new PostgreSQLContainer(workload);
		return await container.start(options);
	}

	async startMySql<C>(workload: MySqlDatabase<C>, options?: StartOptions) {
		const container = new MySQLContainer(workload);
		return await container.start(options);
	}

	async startMailer<C>(workload: Mailer<C>, options?: StartOptions) {
		const container = new MailerContainer(workload);
		return await container.start(options);
	}

	#localStackContainer?: LocalStackContainer;

	async localStackContainer() {
		if (this.#localStackContainer === undefined) {
			return await this.startLocalStack();
		}
		return this.#localStackContainer;
	}
	async startLocalStack() {
		if (this.#localStackContainer === undefined) {
			const localStackWorkload = new LocalStack("local-stack-testing");
			this.#localStackContainer = new LocalStackContainer(localStackWorkload);
			await this.#localStackContainer.start();
		}
		return this.#localStackContainer;
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
