import { toSnakeCase } from "@monorepo/pg/helpers/to-snake-case.js";
import { PgExtension } from "@monorepo/pg/schema/extension.js";
import { Schema } from "@monorepo/pg/schema/schema.js";
import { connectionOptions } from "@monorepo/services/db-clients/connection-options.js";
import { pgQuery } from "@monorepo/services/db-clients/pg-query.js";
import {
	appEnvironment,
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { pathExists } from "@monorepo/utils/path.js";
import { gen, tryPromise } from "effect/Effect";
import { execa } from "execa";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import ora from "ora";
import path from "path";
import pgConnectionString from "pg-connection-string";
import { cwd, env } from "process";

export const dumpDatabaseStructureTask = gen(function* () {
	const pgDumpExists = yield* checkPgDumpExecutableExists;
	const previousDumpExists = yield* pathExists(yield* databaseDumpPath);

	if (!pgDumpExists) {
		console.log("Missing pg_dump executable");
		if (!previousDumpExists) {
			console.log(
				"A previous database dump already exists and pg_dump is required to generate a new database dump.",
			);
		} else {
			return;
		}
		return;
	}

	const spinner = ora();
	spinner.start("Dump database");
	const result = yield* dumpDatabase;
	spinner.succeed();
	return result;
});

export const dumpDatabase = gen(function* () {
	const path = yield* dumpDatabaseWithoutMigrationTables;
	yield* appendMigrationDataToDump;
	cleanDump(path);
	return path;
});

export const dumpDatabaseWithoutMigrationTables = gen(function* () {
	yield* setPgDumpEnv;
	return yield* dumpStructure;
});

const checkPgDumpExecutableExists = gen(function* () {
	return yield* tryPromise(async () => {
		const { stdout } = await execa("which", ["pg_dump"]);
		return stdout === "";
	});
});

const databaseDumpPath = gen(function* () {
	const env = yield* appEnvironment;

	return path.join(
		env.currentWorkingDir ?? cwd(),
		"monolayer",
		"dumps",
		`structure.${env.currentDatabase.id}.sql`,
	);
});

const setPgDumpEnv = gen(function* () {
	const connectionString = (yield* appEnvironment).currentDatabase
		.connectionString;
	const parsedConfig = pgConnectionString.parse(connectionString);
	env.PGHOST = `${parsedConfig.host}`;
	env.PGPORT = `${parsedConfig.port}`;
	env.PGUSER = `${parsedConfig.user}`;
	env.PGPASSWORD = `${parsedConfig.password}`;
	return true;
});

const dumpStructure = gen(function* () {
	const dumpPath = yield* databaseDumpPath;
	mkdirSync(path.join(path.dirname(dumpPath)), {
		recursive: true,
	});

	const dumpArgs = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		"--quote-all-identifiers",
		...(yield* extensionArgs),
		...(yield* schemaArgs),
		yield* databaseName,
		`--file=${dumpPath}`,
	];

	yield* tryPromise(async () => execa("pg_dump", dumpArgs));
	return dumpPath;
});

const databaseName = gen(function* () {
	return (yield* connectionOptions).databaseName;
});

const schemaArgs = gen(function* () {
	const camelCase = yield* appEnvironmentCamelCasePlugin;

	return (yield* appEnvironmentConfigurationSchemas)
		.map((schema) =>
			toSnakeCase(Schema.info(schema).name ?? "public", camelCase),
		)
		.map((schema) => `--schema=${schema}`);
});

const extensionArgs = gen(function* () {
	const appEnv = yield* appEnvironment;
	return appEnv.currentDatabase.extensions.map(
		(extension) => `--extension=${PgExtension.info(extension).name}`,
	);
});

const monolayerTables = gen(function* () {
	const tables = yield* pgQuery<{ table_name: string }>(`
		SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public'
  	AND table_name LIKE 'monolayer_%';`);
	return tables.map((table) => table.table_name);
});

const appendMigrationDataToDump = gen(function* () {
	const databaseName = (yield* connectionOptions).databaseName;
	const tables = yield* monolayerTables;
	const { stdout } = yield* tryPromise(() =>
		execa("pg_dump", [
			"--no-privileges",
			"--no-owner",
			"--schema=public",
			"--inserts",
			...tables.map((table) => `--table=${table}`),
			"--quote-all-identifiers",
			"-a",
			"--no-comments",
			databaseName,
		]),
	);

	appendFileSync(
		yield* databaseDumpPath,
		stdout
			.split("\n")
			.filter((line) => line.startsWith("INSERT INTO"))
			.join("\n"),
	);
});

function cleanDump(filePath: string) {
	const fileContent = readFileSync(filePath, "utf-8");
	const cleanedContent = fileContent
		.split("\n")
		.map((line) => {
			if (line.match(/CREATE SCHEMA "/)) {
				return line.replace(/CREATE SCHEMA "/, 'CREATE SCHEMA IF NOT EXISTS "');
			}
			return line;
		})
		.filter(
			(line) =>
				!line.includes("-- Dumped from ") && !line.includes("-- Dumped by "),
		)
		.join("\n");
	writeFileSync(filePath, cleanedContent, "utf-8");
}
