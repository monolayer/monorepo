import { remember } from "@epic-web/remember";
import { type StartedTestContainer } from "testcontainers";
import { PostgreSQLContainer } from "~sidecar/containers.js";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { createDatabase } from "~sidecar/containers/admin/create-database.js";
import { defaultTestStartOptions } from "~sidecar/containers/container.js";
import {
	LocalStackContainer,
	localStackContainerSpec,
} from "~sidecar/containers/local-stack.js";
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
		options: {
			initialize?: boolean;
			test: boolean;
		},
	) {
		if (isRedis(workload)) {
			workload.containerOptions({
				startOptions: {
					reuse: !options.test,
					publishToRandomPorts: options.test,
				},
			});
			return await this.startRedis(workload);
		}
		if (isBucket(workload)) {
			workload.containerOptions({
				startOptions: {
					reuse: !options.test,
					publishToRandomPorts: options.test,
				},
			});
			const localStackContainer = await this.startLocalStack(options.test);
			if (options?.initialize) {
				await createBucket(workload.id, localStackContainer);
			}
			return localStackContainer.startedContainer;
		}
		if (isPostgresDatabase(workload)) {
			workload.containerOptions({
				startOptions: {
					reuse: !options.test,
					publishToRandomPorts: options.test,
				},
			});
			let container: StartedTestContainer | undefined = undefined;
			container = await this.startPostgres(workload);
			if (options?.initialize) {
				await createDatabase(workload);
			}
			return container;
		}
		if (isMailer(workload)) {
			workload.containerOptions({
				startOptions: {
					reuse: !options.test,
					publishToRandomPorts: options.test,
				},
			});
			return await this.startMailer(workload);
		}
		if (isMysql(workload)) {
			workload.containerOptions({
				startOptions: {
					reuse: !options.test,
					publishToRandomPorts: options.test,
				},
			});
			return await this.startMySql(workload);
		}
	}

	async startRedis<C>(workload: Redis<C>) {
		const container = new RedisContainer(workload);
		return await container.start();
	}

	async startPostgres<C>(workload: PostgresDatabase<C>) {
		const container = new PostgreSQLContainer(workload);
		return await container.start();
	}

	async startMySql<C>(workload: MySqlDatabase<C>) {
		const container = new MySQLContainer(workload);
		return await container.start();
	}

	async startMailer<C>(workload: Mailer<C>) {
		const container = new MailerContainer(workload);
		return await container.start();
	}

	#localStackContainer?: LocalStackContainer;

	async startLocalStack(test: boolean = false) {
		if (this.#localStackContainer === undefined) {
			const localStackWorkload = new LocalStack("local-stack-testing");
			const options = localStackContainerSpec;
			if (!test) {
				options.environment = {
					...localStackContainerSpec.environment,
					PERSISTENCE: "1",
				};
			} else {
				localStackWorkload.containerOverrides = {
					definition: {
						containerImage: options.containerImage,
					},
					startOptions: defaultTestStartOptions,
				};
			}
			localStackWorkload.containerOverrides = {
				definition: {
					containerImage: options.containerImage,
				},
				startOptions: {
					reuse: !test,
					publishToRandomPorts: test,
				},
			};
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
