import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { getContainerRuntimeClient, ImageName } from "testcontainers";
import { LocalStackContainer } from "~workloads/containers/local-stack.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import { importWorkloads } from "~workloads/scan/workload-imports.js";
import {
	type StatefulWorkload,
	type StatefulWorkloadWithClient,
} from "~workloads/workloads.js";
import {
	assertBucket,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/workloads/assertions.js";

export function pull(program: Command) {
	return program
		.command("pull")
		.description("pull all workloads' Docker images")
		.action(async () => {
			const imports = await importWorkloads();
			const images = (
				await Promise.all(
					imports.workloadsWithContainers.flatMap(
						async (workload) => await containerForWorkload(workload),
					),
				)
			)
				.filter((name) => name !== undefined)
				.reduce<Set<string>>((acc, name) => acc.add(name), new Set<string>());
			await pullImages(Array.from(images));
		});
}

async function containerForWorkload(
	workload: StatefulWorkloadWithClient<unknown> | StatefulWorkload,
) {
	console.log("constructor", workload.constructor.name);
	switch (workload.constructor.name) {
		case "PostgresDatabase":
			assertPostgresDatabase(workload);
			return await new PostgreSQLContainer(workload).containerImage();
		case "MySqlDatabase":
			assertMySqlDatabase(workload);
			return await new MySQLContainer(workload).containerImage();
		case "Redis":
			assertRedis(workload);
			return await new RedisContainer(workload).containerImage();
		case "Bucket":
			assertBucket(workload);
			return await new LocalStackContainer(workload).containerImage();
	}
}

async function pullImages(images: string[]) {
	const spinner = ora();
	for (const image of images) {
		spinner.start(`Pull ${image}`);
		const containerRuntimeClient = await getContainerRuntimeClient();
		await containerRuntimeClient.image.pull(ImageName.fromString(image));
		spinner.succeed();
	}
}
