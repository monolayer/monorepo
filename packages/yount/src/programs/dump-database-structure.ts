import { Effect } from "effect";
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import { env } from "process";
import { Writable, type WritableOptions } from "stream";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import { Schema } from "~/database/schema/schema.js";
import { DbClients } from "../services/dbClients.js";
import { Environment } from "../services/environment.js";
import { pgQuery } from "./pg-query.js";
import { pipeCommandStdoutToWritable } from "./pipe-command-stdout-to-writable.js";
import { spinnerTask } from "./spinner-task.js";

export function dumpDatabaseStructure() {
	return Effect.all([Environment, DbClients]).pipe(
		Effect.flatMap(([environment, dbClients]) =>
			Effect.all([
				databaseSearchPath(),
				databaseInConfig(dbClients.currentEnvironment.databaseName),
				databaseDumpPath(
					environment.configurationName,
					environment.name,
					environment.folder,
				),
				installedExtensions(),
			]).pipe(
				Effect.flatMap(
					([searchPath, database, dumpPath, installedExtensions]) =>
						Effect.succeed(true).pipe(
							Effect.tap(() => setPgDumpEnv(environment.configurationConfig)),
							Effect.tap(() =>
								dumpStructure(
									database,
									dumpPath,
									environment.configuration.schemas.map(
										(schema) => Schema.info(schema).name || "public",
									),
									installedExtensions,
								),
							),
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
	);
}
export function dumpDatabaseStructureTask() {
	return spinnerTask("Dump database structure", () => dumpDatabaseStructure());
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

function installedExtensions() {
	return DbClients.pipe(
		Effect.flatMap((dbClients) =>
			Effect.tryPromise(() =>
				dbExtensionInfo(dbClients.developmentEnvironment.kyselyNoCamelCase),
			),
		),
		Effect.flatMap((extensions) => Effect.succeed(Object.keys(extensions))),
	);
}

function setPgDumpEnv(environmentConfig: pg.ClientConfig & pg.PoolConfig) {
	const parsedConfig =
		environmentConfig.connectionString !== undefined
			? pgConnectionString.parse(environmentConfig.connectionString)
			: environmentConfig;

	env.PGHOST = `${parsedConfig.host}`;
	env.PGPORT = `${parsedConfig.port}`;
	env.PGUSER = `${parsedConfig.user}`;
	env.PGPASSWORD = `${parsedConfig.password}`;
	return Effect.succeed(true);
}

function dumpStructure(
	database: string,
	dumpPath: string,
	schemaNames: string[],
	installedExtensions: string[],
) {
	const schemaArgs = schemaNames.map((schema) => `--schema=${schema}`);
	const extensionArgs = installedExtensions.map(
		(extension) => `--extension=${extension}`,
	);

	const args = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		...schemaArgs,
		...extensionArgs,
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

function databaseInConfig(database: string) {
	if (database === "") {
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
