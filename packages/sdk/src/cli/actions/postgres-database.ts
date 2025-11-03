import type { Command } from "@commander-js/extra-typings";
import { camelCase, kebabCase, snakeCase } from "case-anything";
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
			const databaseOptions = options.name
				? { id: kebabCase(options.name), name: camelCase(options.name) }
				: await promptDatabaseName();

			if (options.skipComponents) {
				addPostgresWorkload(databaseOptions);
				return;
			}

			let orm = options.orm;
			if (!orm) {
				orm = await promptORM();
			}

			switch (orm) {
				case "prisma":
					await addPrismaPosgres(databaseOptions);
					break;
				case "drizzle":
					await addDrizzlePostgres(databaseOptions);
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
