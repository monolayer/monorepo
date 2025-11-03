import type { Command } from "@commander-js/extra-typings";
import { kebabCase, snakeCase } from "case-anything";
import { exit } from "process";
import prompts from "prompts";
import { addDrizzlePostgres } from "~workloads/scaffolding/drizzle.js";
import { addPostgresWorkload } from "~workloads/scaffolding/postgres-database-workload.js";
import { addPrismaPosgres } from "~workloads/scaffolding/prisma.js";

export function postgresDatabase(command: Command) {
	return command
		.command("postgres-database")
		.description("add a postgreDatabase workload")
		.option("--name <name>", "Name of the database")
		.option("--orm <orm>", "ORM to use (prisma, drizzle, none)")
		.option("--skip-components", "Skip installation of ORM components")
		.action(async (options) => {
			const databaseName = options.name ?? (await promptDatabaseName()).name;
			const databaseId = kebabCase(databaseName);

			if (options.skipComponents) {
				addPostgresWorkload(databaseId);
				return;
			}

			let orm = options.orm;
			if (!orm) {
				orm = await promptORM();
			}

			switch (orm) {
				case "prisma":
					await addPrismaPosgres(databaseId);
					break;
				case "drizzle":
					await addDrizzlePostgres(databaseId);
					break;
				default:
					console.error("Invalid ORM option. Must be 'prisma' or 'drizzle'.");
					exit(1);
			}
		});
}

async function promptORM() {
	const ormChoices = [
		{
			title: "Prisma ORM",
			value: "prisma" as const,
		},
		{
			title: "Drizzle",
			value: "drizzle" as const,
		},
		{
			title: "Skip (already have a client configured)",
			value: "none" as const,
		},
	];
	let aborted = false;
	const select = await prompts({
		type: "select",
		name: "orm",
		message: `Select ORM`,
		choices: ormChoices,
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return select.orm;
}

async function promptDatabaseName() {
	let aborted = false;
	const select = await prompts({
		type: "text",
		name: "databaseName",
		message: `Database name`,
		initial: "app",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return {
		name: snakeCase(select.databaseName),
		id: kebabCase(select.databaseName),
	};
}
