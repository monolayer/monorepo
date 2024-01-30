import { pgTable } from "./table.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type pgDatabase<O extends Record<string, pgTable<string, any>>> = {
	tables?: O;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function pgDatabase<O extends Record<string, pgTable<string, any>>>(
	tables: O,
) {
	const database = <pgDatabase<O>>{ tables: tables };
	return database;
}
