import type { Command } from "@commander-js/extra-typings";
import { kebabCase, snakeCase } from "case-anything";
import { exit } from "process";
import prompts from "prompts";
import { addDrizzlePostgres } from "~workloads/scaffolding/drizzle.js";
import { addPrismaPosgres } from "~workloads/scaffolding/prisma.js";

export function add(program: Command) {
	const add = program.command("add").description("add a workload");
	postgresDatabase(add);
	return add;
}

function postgresDatabase(program: Command) {
	return program
		.command("postgres-database")
		.description("add a postgreDatabase workload")
		.action(async () => {
			const database = await promptDatabaseName();
			const orm = await promptORM();
			switch (orm) {
				case "prisma":
					await addPrismaPosgres(database.id);
					break;
				case "drizzle":
					await addDrizzlePostgres(database.id);
					break;
				case "none":
					break;
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
