import { type OptionalTableSchema, pgTable } from "./table.js";

export type pgDatabase<
	O extends Record<string, pgTable<string, OptionalTableSchema>>,
> = {
	tables: O;
	kyselyDatabase: {
		[K in keyof O]: O[K]["infer"];
	};
};

export function pgDatabase<
	O extends Record<string, pgTable<string, OptionalTableSchema>>,
>(tables: O) {
	const database = <pgDatabase<O>>{ tables: tables };
	return database;
}
