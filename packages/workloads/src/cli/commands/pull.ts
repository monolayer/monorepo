import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { getContainerRuntimeClient, ImageName } from "testcontainers";
import {
	assertElasticSearch,
	assertMailer,
	assertMongoDb,
	assertMySqlDatabase,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/containers/admin/assertions.js";
import { ElasticSearchContainer } from "~workloads/containers/elastic-search.js";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { MongoDbContainer } from "~workloads/containers/mongo-db.js";
import { MySQLContainer } from "~workloads/containers/mysql.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import { type StatefulWorkloadWithClient } from "~workloads/workloads.js";
import { importWorkloads } from "~workloads/workloads/import.js";

export function pull(program: Command) {
	return program
		.command("pull")
		.description("Pull all Docker images")
		.action(async () => {
			const workloads = await importWorkloads();
			const images = (
				await Promise.all(
					workloads.flatMap(
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
	workload: StatefulWorkloadWithClient<unknown>,
) {
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
		case "ElasticSearch":
			assertElasticSearch(workload);
			return await new ElasticSearchContainer(workload).containerImage();
		case "MongoDb":
			assertMongoDb(workload);
			return await new MongoDbContainer(workload).containerImage();
		case "Mailer":
			assertMailer(workload);
			return await new MailerContainer(workload).containerImage();
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
