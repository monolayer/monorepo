import type { PgExtensions } from "./pg_extension.js";
import { type PgTable } from "./pg_table.js";

export type pgDatabase<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	T extends Record<string, PgTable<any, any>>,
> = {
	extensions: PgExtensions;
	tables?: T;
	kyselyDatabase: {
		[K in keyof T]: T[K]["infer"];
	};
};

export function pgDatabase<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	T extends Record<string, PgTable<any, any>>,
>({ extensions, tables }: { extensions?: PgExtensions; tables?: T }) {
	const database = <pgDatabase<T>>{
		extensions: extensions !== undefined ? extensions : [],
		tables: tables !== undefined ? tables : {},
	};
	return database;
}
