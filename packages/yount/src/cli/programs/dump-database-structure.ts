import { Effect } from "effect";
import { appendFileSync, writeFileSync } from "fs";
import path from "path";
import type { ClientConfig, Pool, PoolConfig } from "pg";
import type { ConnectionOptions } from "pg-connection-string";
import { env } from "process";
import { Writable, type WritableOptions } from "stream";
import { Environment } from "../services/environment.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { pgQuery } from "./pg-query.js";
import { pipeCommandStdoutToWritable } from "./pipe-command-stdout-to-writable.js";

export function dumpDatabaseStructure() {
	return spinnerTask("Dump database structure", () =>
		Effect.gen(function* (_) {
			const environment = yield* _(Environment);
			const searchPath = yield* _(databaseSearchPath(environment.pg.pool));
			const database = yield* _(databaseInConfig(environment.pg.config));
			const dumpPath = path.join(
				environment.config.folder,
				environment.name === "development"
					? "structure.sql"
					: `structure_${environment.name}.sql`,
			);
			yield* _(setPgDumpEnv(environment.pg.config));
			yield* _(dumpStructure(database, dumpPath));
			appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
			yield* _(appendMigrationData(database, dumpPath));
			return yield* _(Effect.succeed(true));
		}),
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

function databaseSearchPath(pool: Pool) {
	return Effect.gen(function* (_) {
		const result = yield* _(
			pgQuery<{
				search_path: string;
			}>(pool, "SHOW search_path"),
		);
		if (result[0] === undefined) {
			return yield* _(Effect.fail(new Error("Search path not found")));
		} else {
			return yield* _(Effect.succeed(result[0].search_path));
		}
	});
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
