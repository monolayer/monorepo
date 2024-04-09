import { Effect } from "effect";
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import type { ClientConfig, PoolConfig } from "pg";
import type { ConnectionOptions } from "pg-connection-string";
import { env } from "process";
import { Writable, type WritableOptions } from "stream";
import { Environment } from "../services/environment.js";
import { Pg } from "../services/pg.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { pgQuery } from "./pg-query.js";
import { pipeCommandStdoutToWritable } from "./pipe-command-stdout-to-writable.js";

export function dumpDatabaseStructure() {
	return spinnerTask("Dump database structure", () =>
		Effect.all([Environment, Pg]).pipe(
			Effect.flatMap(([environment, pg]) =>
				Effect.all([
					databaseSearchPath(),
					databaseInConfig(pg.config),
					databaseDumpPath(
						environment.connectorName,
						environment.name,
						environment.folder,
					),
				]).pipe(
					Effect.flatMap(([searchPath, database, dumpPath]) =>
						Effect.succeed(true).pipe(
							Effect.tap(() => setPgDumpEnv(pg.config)),
							Effect.tap(() => dumpStructure(database, dumpPath)),
							Effect.tap(() =>
								appendFileSync(
									dumpPath,
									`SET search_path TO ${searchPath};\n\n`,
								),
							),
							Effect.tap(() => appendMigrationData(database, dumpPath)),
						),
					),
					Effect.flatMap(() => Effect.succeed(true)),
				),
			),
		),
	);
}

function appendMigrationData(database: string, dumpPath: string) {
	const migrationDumpArgs = [
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		"--inserts",
		"--table=kysely_migration_lock",
		"--table=kysely_migration",
		"-a",
		"--no-comments",
		`${database}`,
	];

	return pipeCommandStdoutToWritable(
		"pg_dump",
		migrationDumpArgs,
		new InsertWritable(dumpPath),
	);
}

function setPgDumpEnv(config: (ClientConfig & PoolConfig) | ConnectionOptions) {
	env.PGHOST = `${config.host}`;
	env.PGPORT = `${config.port}`;
	env.PGUSER = `${config.user}`;
	env.PGPASSWORD = `${config.password}`;
	return Effect.succeed(true);
}

function dumpStructure(database: string, dumpPath: string) {
	const args = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		`${database}`,
	];

	mkdirSync(path.join(path.dirname(dumpPath)), {
		recursive: true,
	});

	return pipeCommandStdoutToWritable(
		"pg_dump",
		args,
		new DumpWritable(dumpPath),
	);
}

function databaseInConfig(
	config: (ClientConfig & PoolConfig) | ConnectionOptions,
) {
	const database = config.database;
	if (database === undefined || database === null) {
		return Effect.fail(new Error("Database not defined in configuration."));
	}
	return Effect.succeed(database);
}

function databaseSearchPath() {
	return pgQuery<{
		search_path: string;
	}>("SHOW search_path").pipe(
		Effect.flatMap((result) =>
			Effect.if(result[0] === undefined, {
				onTrue: Effect.fail(new Error("Search path not found")),
				onFalse: Effect.succeed(result[0]!.search_path),
			}),
		),
	);
}

function databaseDumpPath(
	connectionName: string,
	environment: string,
	folder: string,
) {
	return Effect.succeed(
		path.join(
			folder,
			"dumps",
			environment === "development"
				? `structure.${connectionName}.sql`
				: `structure_${environment}.${connectionName}.sql`,
		),
	);
}
class DumpWritable extends Writable {
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
			if (line.startsWith("CREATE SCHEMA ")) {
				this.#contents.push(
					line.replace("CREATE SCHEMA ", "CREATE SCHEMA IF NOT EXISTS "),
				);
				continue;
			}
			if (!line.startsWith("-- Dumped")) {
				this.#contents.push(line);
			}
		}
		callback();
	}

	end() {
		writeFileSync(this.#dumpPath, this.#contents.join("\n"));
		return this;
	}
}

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
