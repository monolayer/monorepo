import { type PgTable } from "./pg_table.js";

export type pgDatabase<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	O extends Record<string, PgTable<string, any>>,
> = {
	tables: O;
	kyselyDatabase: {
		[K in keyof O]: O[K]["infer"];
	};
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function pgDatabase<O extends Record<string, PgTable<string, any>>>(
	tables: O,
) {
	const database = <pgDatabase<O>>{ tables: tables };
	return database;
}
