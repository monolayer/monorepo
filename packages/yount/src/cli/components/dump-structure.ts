import { execa } from "execa";
import { appendFileSync, writeFileSync } from "fs";
import path from "path";
import { env } from "process";
import { Writable, type WritableOptions } from "stream";
import type { Config } from "~/config.js";
import { pgPoolAndConfig } from "~/pg/pg-pool.js";
import { pgQueryExecuteWithResult } from "~/pg/pg-query.js";
import { ActionStatus, isExecaError, runAndPipeCommand } from "../command.js";

export async function dumpStructure(config: Config, environment: string) {
	const pool = pgPoolAndConfig(config, environment);

	const searchPathQueryResult = await pgQueryExecuteWithResult<{
		search_path: string;
	}>(pool.pool, "SHOW search_path");
	if (searchPathQueryResult.status === ActionStatus.Error) {
		return searchPathQueryResult.error;
	}

	const searchPath = searchPathQueryResult.result[0]?.search_path;

	env.PGHOST = `${pool.config.host}`;
	env.PGPORT = `${pool.config.port}`;
	env.PGUSER = `${pool.config.user}`;
	env.PGPASSWORD = `${pool.config.password}`;

	const dumpPath = path.join(config.folder, `${pool.config.database}.sql`);

	const result = await dumpSchema(pool.config.database || "", dumpPath);

	if (result.success === false) {
		if (isExecaError(result.error))
			return new Error(result.error.stderr?.toString());
		if (result.error instanceof Error) return result.error;
	}

	if (searchPath !== undefined)
		appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
	await dumpMigrationInfoArgs(pool.config.database || "", dumpPath);
	return pool.config.database as string;
}

async function dumpSchema(database: string, dumpPath: string) {
	const args = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		`${database}`,
	];
	return runAndPipeCommand("pg_dump", args, new DumpWritable(dumpPath));
}

async function dumpMigrationInfoArgs(database: string, dumpPath: string) {
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
	const dump = execa("pg_dump", migrationDumpArgs);
	if (dump.pipeStdout !== undefined) {
		const { stdout } = await dump.pipeStdout(new InsertWritable(dumpPath));
		return stdout;
	}
}

export class DumpWritable extends Writable {
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

export class InsertWritable extends Writable {
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
