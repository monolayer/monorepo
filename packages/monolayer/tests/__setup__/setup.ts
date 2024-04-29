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
import { revisionNamePrompt } from "~/prompts/revision-name.js";
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
			port: Number(env.POSTGRES_ONE_PORT ?? 5432),
		});
	}
	return globalTestThis.pool;
}

export function globalPoolTwo() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.poolTwo === undefined) {
		globalTestThis.poolTwo = new pg.Pool({
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_TWO_PORT ?? 5432),
		});
	}
	return globalTestThis.poolTwo;
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

vi.mock("~/prompts/revision-name.js", async (importOriginal) => {
	await importOriginal();
	return {
		revisionNamePrompt: vi.fn(async () => "default"),
	};
});

const revisionPath = path.join(cwd(), "src", "revisions/revision.ts");

export function mockedCreateFile(
	originalImport: typeof import("~/create-file.ts"),
) {
	return vi.fn((path: string, content: string, log = true) => {
		originalImport.createFile(
			path,
			content.replace("monolayer/revision", revisionPath),
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
				content.replace("monolayer/revision", revisionPath),
				log,
			);
		}),
	};
});

vi.mocked(tableDiffPrompt).mockResolvedValue([]);

vi.mocked(revisionNamePrompt).mockResolvedValue("default");

export function mockTableDiffOnce(value: TablesToRename) {
	vi.mocked(tableDiffPrompt).mockResolvedValueOnce(value);
}

export function mockColumnDiffOnce(value: ColumnsToRename) {
	vi.mocked(columnDiffPrompt).mockResolvedValueOnce(value);
}
