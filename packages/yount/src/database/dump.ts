import { Effect } from "effect";
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import pgConnectionString from "pg-connection-string";
import { env } from "process";
import { Writable, type WritableOptions } from "stream";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import { Schema } from "~/database/schema/schema.js";
import { pgQuery } from "~/services/db-clients.js";
import { pipeCommandStdoutToWritable } from "../cli/pipe-command-stdout-to-writable.js";
import { spinnerTask } from "../cli/spinner-task.js";
import { DbClients } from "../services/db-clients.js";
import { Environment } from "../services/environment.js";

export function dumpDatabase() {
	return setPgDumpEnv().pipe(
		Effect.tap(dumpStructure),
		Effect.tap(appendSearchPathToDump),
		Effect.tap(appendMigrationDataToDump),
		Effect.tap(Effect.succeed(true)),
	);
}

export function dumpDatabaseStructureTask() {
	return spinnerTask("Dump database structure", () => dumpDatabase());
}

function appendMigrationDataToDump() {
	return Effect.gen(function* (_) {
		const database = yield* _(databaseInConfig());
		const dumpPath = yield* _(databaseDumpPath());
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
		yield* _(
			pipeCommandStdoutToWritable(
				"pg_dump",
				migrationDumpArgs,
				new InsertWritable(dumpPath),
			),
		);
	});
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

function setPgDumpEnv() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const config = environment.configurationConfig;
		const parsedConfig =
			config.connectionString !== undefined
				? pgConnectionString.parse(config.connectionString)
				: config;
		env.PGHOST = `${parsedConfig.host}`;
		env.PGPORT = `${parsedConfig.port}`;
		env.PGUSER = `${parsedConfig.user}`;
		env.PGPASSWORD = `${parsedConfig.password}`;
		return true;
	});
}

function dumpStructure() {
	return Effect.gen(function* (_) {
		const schemaArgs = (yield* _(Environment)).configuration.schemas
			.map((schema) => Schema.info(schema).name || "public")
			.map((schema) => `--schema=${schema}`);
		const extensionArgs = (yield* _(installedExtensions())).map(
			(extension) => `--extension=${extension}`,
		);
		const args = [
			"--schema-only",
			"--no-privileges",
			"--no-owner",
			...schemaArgs,
			...extensionArgs,
			`${yield* _(databaseInConfig())}`,
		];

		const dumpPath = yield* _(databaseDumpPath());

		mkdirSync(path.join(path.dirname(dumpPath)), {
			recursive: true,
		});

		yield* _(
			pipeCommandStdoutToWritable("pg_dump", args, new DumpWritable(dumpPath)),
		);
	});
}

function databaseInConfig() {
	return Effect.gen(function* (_) {
		const db = yield* _(DbClients);
		if (db.currentEnvironment.databaseName === "") {
			return yield* _(
				Effect.fail(new Error("Database not defined in configuration.")),
			);
		}
		return db.currentEnvironment.databaseName;
	});
}

function databaseSearchPath() {
	return pgQuery<{
		search_path: string;
	}>("SHOW search_path").pipe(
		Effect.flatMap((result) =>
			Effect.if(result[0] === undefined, {
				onTrue: () => Effect.fail(new Error("Search path not found")),
				onFalse: () => Effect.succeed(result[0]!.search_path),
			}),
		),
	);
}

function databaseDumpPath() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		return path.join(
			environment.folder,
			"dumps",
			environment.name === "development"
				? `structure.${environment.configurationName}.sql`
				: `structure_${environment.name}.${environment.configurationName}.sql`,
		);
	});
}

function appendSearchPathToDump() {
	return Effect.all([databaseDumpPath(), databaseSearchPath()]).pipe(
		Effect.tap(([dumpPath, searchPath]) =>
			appendFileSync(dumpPath, `SET search_path TO ${searchPath};\n\n`),
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
