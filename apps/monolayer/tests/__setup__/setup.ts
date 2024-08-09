import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import { askColumnsToRename } from "@monorepo/prompts/columns-to-rename.js";
import { askMigrationName } from "@monorepo/prompts/migration-name.js";
import { tablesToRename } from "@monorepo/prompts/tables-to-rename.js";
import type { ColumnsToRename } from "@monorepo/state/table-column-rename.js";
import dotenv from "dotenv";
import { Effect } from "effect";
import { env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { vi } from "vitest";

dotenv.config();

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

vi.mock("@monorepo/prompts/tables-to-rename.js", async (importOriginal) => {
	const actual =
		(await importOriginal()) as typeof import("@monorepo/prompts/tables-to-rename.js");
	return {
		...actual,
		tablesToRename: vi.fn(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			async (_tableDiff: { added: string[]; deleted: string[] }) => [],
		),
	};
});

vi.mock("@monorepo/prompts/columns-to-rename.js", async (importOriginal) => {
	const actual =
		(await importOriginal()) as typeof import("@monorepo/prompts/columns-to-rename.ts");
	return {
		...actual,
		columnsToRenamePrompt: vi.fn(
			(
				schemaName: string,
				diff: Record<
					string,
					{
						added: string[];
						deleted: string[];
					}
				>,
			) => {
				return Effect.gen(function* () {
					return yield* Effect.tryPromise(() =>
						askColumnsToRename(diff, schemaName),
					);
				});
			},
		),
		askColumnsToRename: vi.fn(
			async (
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				_columnDiff: Record<
					string,
					{
						added: string[];
						deleted: string[];
					}
				>,
			) => {
				const columnsToRename: ColumnsToRename = {};
				return columnsToRename;
			},
		),
	};
});

vi.mock("@monorepo/prompts/migration-name.js", async () => {
	return {
		migrationNamePrompt: () => Effect.succeed("default"),
		askMigrationName: vi.fn(async () => {
			return "default";
		}),
	};
});

// const migrationPath = path.join(cwd(), "src", "migrations/migration.ts");

// vi.mock("@monorepo/utils/create-file.ts", async (importOriginal) => {
// 	const original =
// 		await importOriginal<typeof import("@monorepo/utils/create-file.ts")>();
// 	return {
// 		createFile: vi.fn((path: string, content: string, log = true) => {
// 			original.createFile(
// 				path,
// 				content.replace("monolayer/migration", migrationPath),
// 				log,
// 			);
// 		}),
// 	};
// });

vi.mocked(askMigrationName).mockResolvedValueOnce("default");

export function mockTableDiffOnce(value: TablesToRename) {
	vi.mocked(tablesToRename).mockResolvedValueOnce(value);
}

export function mockColumnDiffOnce(value: ColumnsToRename) {
	vi.mocked(askColumnsToRename).mockResolvedValueOnce(value);
}
