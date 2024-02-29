import type { PgExtensions } from "./pg_extension.js";
import { type AnyPgTable } from "./pg_table.js";

export type pgDatabase<T extends Record<string, AnyPgTable>> = {
	extensions: PgExtensions;
	tables?: T;
	kyselyDatabase: {
		[K in keyof T]: T[K]["infer"];
	};
};

export function pgDatabase<T extends Record<string, AnyPgTable>>({
	extensions,
	tables,
}: { extensions?: PgExtensions; tables?: T }) {
	const database = <pgDatabase<T>>{
		extensions: extensions !== undefined ? extensions : [],
		tables: tables !== undefined ? tables : {},
	};
	return database;
}

export type AnyPgDatabase = pgDatabase<Record<string, AnyPgTable>>;
