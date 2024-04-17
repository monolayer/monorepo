import dotenv from "dotenv";
import { env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { vi } from "vitest";
import type { ColumnsToRename } from "~/programs/column-diff-prompt.js";
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

vi.mock("~/programs/table-diff-prompt.js", async (importOriginal) => {
	await importOriginal();
	return {
		tableDiffPrompt: vi.fn(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			async (_tableDiff: { added: string[]; deleted: string[] }) => [],
		),
	};
});

vi.mock("~/programs/column-diff-prompt.js", async (importOriginal) => {
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
