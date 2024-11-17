import { remember } from "@epic-web/remember";
import { type StartedTestContainer } from "testcontainers";
import { PostgreSQLContainer } from "~sidecar/containers.js";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { createDatabase } from "~sidecar/containers/admin/create-database.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/workloads/stateful/bucket.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";
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

class ContainerStarter {
	async startContainerForWorkload(
		workload: unknown,
		initialize: boolean = true,
	) {
		if (isRedis(workload)) {
			return await this.startRedis(workload);
		}
		if (isBucket(workload)) {
			const localStackContainer = await this.startLocalStack();
			if (initialize) {
				await createBucket(workload.id, localStackContainer);
			}
			return localStackContainer.startedContainer;
		}
		if (isPostgresDatabase(workload)) {
			let container: StartedTestContainer | undefined = undefined;
			container = await this.startPostgres(workload);
			if (initialize) {
				await createDatabase(workload);
			}
			return container;
		}
		if (isMailer(workload)) {
			return await this.startMailer(workload);
		}
	}

	async startRedis<C>(workload: Redis<C>) {
		const container = new RedisContainer(workload);
		return await container.start();
	}

	async startPostgres<C>(workload: PostgresDatabase<C>) {
		const container = new PostgreSQLContainer(workload);
		return await container.start({
			persistenceVolumes: true,
			reuse: true,
		});
	}

	async startMailer<C>(workload: Mailer<C>) {
		const container = new MailerContainer(workload);
		return await container.start();
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
