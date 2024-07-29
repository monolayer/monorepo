import dotenv from "dotenv";
import path from "node:path";
import { cwd, env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { vi } from "vitest";
import {
	type ColumnsToRename,
	type TablesToRename,
} from "~/introspection/introspect-schemas.js";
import { columnDiffPrompt } from "~/prompts/column-diff.js";
import { migrationNamePrompt } from "~/prompts/migration-name.js";
import { tableDiffPrompt } from "~/prompts/table-diff.js";
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

vi.mock("~/prompts/table-diff.js", async (importOriginal) => {
	await importOriginal();
	return {
		tableDiffPrompt: vi.fn(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			async (_tableDiff: { added: string[]; deleted: string[] }) => [],
		),
	};
});

vi.mock("~/prompts/column-diff.js", async (importOriginal) => {
	await importOriginal();
	return {
		columnDiffPrompt: vi.fn(
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

vi.mock("~/prompts/migration-name.js", async (importOriginal) => {
	await importOriginal();
	return {
		migrationNamePrompt: vi.fn(async () => "default"),
	};
});

const migrationPath = path.join(cwd(), "src", "migrations/migration.ts");

export function mockedCreateFile(
	originalImport: typeof import("~/create-file.ts"),
) {
	return vi.fn((path: string, content: string, log = true) => {
		originalImport.createFile(
			path,
			content.replace("monolayer/migration", migrationPath),
			log,
		);
	});
}

vi.mock("~/create-file.ts", async (importOriginal) => {
	const original = await importOriginal<typeof import("~/create-file.ts")>();
	return {
		createFile: vi.fn((path: string, content: string, log = true) => {
			original.createFile(
				path,
				content.replace("monolayer/migration", migrationPath),
				log,
			);
		}),
	};
});

vi.mocked(tableDiffPrompt).mockResolvedValue([]);

vi.mocked(migrationNamePrompt).mockResolvedValue("default");

export function mockTableDiffOnce(value: TablesToRename) {
	vi.mocked(tableDiffPrompt).mockResolvedValueOnce(value);
}

export function mockColumnDiffOnce(value: ColumnsToRename) {
	vi.mocked(columnDiffPrompt).mockResolvedValueOnce(value);
}
