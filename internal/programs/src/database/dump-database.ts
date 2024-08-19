import * as p from "@clack/prompts";
import { pipeCommandStdoutToWritable } from "@monorepo/base/programs/pipe-command-stdout-to-writable.js";
import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { Schema } from "@monorepo/pg/schema/schema.js";
import { connectionOptions } from "@monorepo/services/db-clients.js";
import {
	appEnvironment,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { pathExists } from "@monorepo/utils/path.js";
import { Effect } from "effect";
import { execa } from "execa";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import pgConnectionString from "pg-connection-string";
import { cwd, env } from "process";
import { Writable, type WritableOptions } from "stream";

export const dumpDatabaseStructureTask = Effect.gen(function* () {
	const pgDumpExists = yield* checkPgDumpExecutableExists;
	const previousDumpExists = yield* pathExists(yield* databaseDumpPath);

	if (!pgDumpExists) {
		if (!previousDumpExists) {
			p.log.warning("Missing pg_dump executable");
			p.log.message(
				"A previous database dump already exists and pg_dump is required to generate a new database dump.",
			);
		} else {
			return;
		}
	}

	yield* spinnerTask("Dump database structure", () => dumpDatabase);
});

export const dumpDatabase = Effect.gen(function* () {
	const path = yield* dumpDatabaseWithoutMigrationTables;
	yield* appendMigrationDataToDump;
	cleanDump(path);
});

export const dumpDatabaseWithoutMigrationTables = Effect.gen(function* () {
	yield* setPgDumpEnv;
	return yield* dumpStructure;
});

const checkPgDumpExecutableExists = Effect.gen(function* () {
	return yield* Effect.tryPromise(async () => {
		const { stdout } = await execa("which", ["pg_dump"]);
		return stdout !== "";
	});
});

const databaseDumpPath = Effect.gen(function* () {
	const env = yield* appEnvironment;

	return path.join(
		cwd(),
		"monolayer",
		"dumps",
		`structure.${env.database.id}.sql`,
	);
});

const setPgDumpEnv = Effect.gen(function* () {
	const connectionString = (yield* appEnvironment).database.connectionString;
	const parsedConfig = pgConnectionString.parse(connectionString);
	env.PGHOST = `${parsedConfig.host}`;
	env.PGPORT = `${parsedConfig.port}`;
	env.PGUSER = `${parsedConfig.user}`;
	env.PGPASSWORD = `${parsedConfig.password}`;
	return true;
});

const dumpStructure = Effect.gen(function* () {
	const schemaArgs = (yield* appEnvironmentConfigurationSchemas)
		.map((schema) => Schema.info(schema).name || "public")
		.map((schema) => `--schema=${schema}`);

	const database = (yield* connectionOptions).databaseName;

	const dumpPath = yield* databaseDumpPath;

	mkdirSync(path.join(path.dirname(dumpPath)), {
		recursive: true,
	});

	yield* Effect.tryPromise(async () =>
		execa("pg_dump", [
			"--schema-only",
			"--no-privileges",
			"--no-owner",
			"--quote-all-identifiers",
			...schemaArgs,
			database,
			`--file=${dumpPath}`,
		]),
	);

	return dumpPath;
});

class InsertWritable extends Writable {
	#dumpPath: string;
	#contents: string[] = [];

	constructor(dumpPath: string, opts?: WritableOptions) {
		super(opts);
		this.#dumpPath = dumpPath;
	}

	_write(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chunk: any,
		_encoding: BufferEncoding,
		callback: (error?: Error | null) => void,
	) {
		const lines = chunk.toString().split("\n");
		for (const line of lines) {
			if (line.startsWith("INSERT INTO")) {
				this.#contents.push(line);
			}
		}
		callback();
	}
	end() {
		appendFileSync(this.#dumpPath, this.#contents.join("\n"));
		return this;
	}
}

const appendMigrationDataToDump = Effect.gen(function* () {
	yield* pipeCommandStdoutToWritable(
		"pg_dump",
		[
			"--no-privileges",
			"--no-owner",
			"--schema=public",
			"--inserts",
			"--table=monolayer_alter_migration_lock",
			"--table=monolayer_alter_migration",
			"--table=monolayer_expand_migration_lock",
			"--table=monolayer_expand_migration",
			"--table=monolayer_contract_migration_lock",
			"--table=monolayer_contract_migration",
			"--table=monolayer_data_migration_lock",
			"--table=monolayer_data_migration",
			"--quote-all-identifiers",
			"-a",
			"--no-comments",
			`${(yield* connectionOptions).databaseName}`,
		],
		new InsertWritable(yield* databaseDumpPath),
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
