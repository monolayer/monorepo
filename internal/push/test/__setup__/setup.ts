import { hashValue } from "@monorepo/utils/hash-value.js";
import dotenv from "dotenv";
import { Effect } from "effect";
import { succeed } from "effect/Effect";
import { Kysely, PostgresDialect, sql } from "kysely";
import { mkdirSync, rmSync } from "node:fs";
import path, { dirname } from "node:path";
import { cwd, env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { fileURLToPath } from "url";
import type { RunnerTestSuite, TaskContext } from "vitest";
import { afterEach, beforeEach, vi } from "vitest";
import type { AnyKysely } from "~push/changeset/introspection.js";
import type { SchemaIntrospection } from "~push/changeset/schema-changeset.js";

export interface TestContext {
	adminDbClient: AnyKysely;
	dbClient: AnyKysely;
	databaseName: string;
	testDir: string;
	queryLog: string[];
	camelCase?: boolean;
}

export function dbNameForTest(context: TaskContext) {
	const parts = [];
	let suite: RunnerTestSuite | undefined;
	suite = context.task.suite;
	while (suite !== undefined) {
		parts.push(suite.name.replace(/ /g, "_").toLowerCase());
		suite = suite.suite;
	}
	const task = context.task.name.replace(/ /g, "_").toLowerCase();
	return hashValue(`${parts.join("_")}_${task}`);
}

export function pgConnectionString() {
	const config: Record<string, string> = {};

	dotenv.config({ path: ".env.test", processEnv: config });
	return `postgres://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}`;
}

dotenv.config({
	path: path.resolve(currentWorkingDirectory(), ".env.test"),
});

export type GlobalThisInTests = GlobalThis & {
	pool: pg.Pool | undefined;
	poolTwo: pg.Pool | undefined;
};

export function globalPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.pool === undefined) {
		globalTestThis.pool = new pg.Pool({
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_PORT ?? 5432),
		});
	}
	return globalTestThis.pool;
}

vi.mock(
	"~push/migrator/transforms/renames/prompt.js",
	async (importOriginal) => {
		const actual =
			(await importOriginal()) as typeof import("~push/prompts/table-column-rename.js");
		return {
			...actual,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			promptRenames: vi.fn((introspections: SchemaIntrospection[]) => {
				return Effect.gen(function* () {
					return yield* succeed({
						tablesToRename: [],
						columnsToRename: {},
					});
				});
			}),
		};
	},
);

export function currentWorkingDirectory() {
	return path.resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

dotenv.config({ path: ".env.test" });

beforeEach<TestContext>(async (context) => {
	const testDb = `case_${dbNameForTest(context)}`;
	context.testDir = path.join(cwd(), "tmp", testDb);
	context.queryLog = [];
	rmSync(context.testDir, { recursive: true, force: true });
	mkdirSync(context.testDir, { recursive: true });

	context.databaseName = testDb;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context.adminDbClient = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: pgConnectionString(),
			}),
		}),
	});
	process.env.MONO_PG_DEFAULT_DATABASE_URL = `${pgConnectionString()}/${testDb}`;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context.dbClient = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: `${pgConnectionString()}/${testDb}`,
			}),
		}),
	});

	await sql`DROP DATABASE IF EXISTS ${sql.ref(testDb)};`.execute(
		context.adminDbClient,
	);
	await sql`CREATE DATABASE ${sql.ref(testDb)};`.execute(context.adminDbClient);
});

afterEach<TestContext>(async (context) => {
	await context.dbClient.destroy();
	await sql`DROP DATABASE IF EXISTS ${sql.ref(context.databaseName)};`.execute(
		context.adminDbClient,
	);
	await context.adminDbClient.destroy();
	// chdir(context.currentWorkingDirectory);
});
