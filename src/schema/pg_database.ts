import { type IntrospectedTable } from "./introspect_table.js";
import type { PgExtensions } from "./pg_extension.js";
import { tableInfo, type AnyPgTable } from "./pg_table.js";

export type pgDatabase<T extends Record<string, AnyPgTable>> = {
	extensions: PgExtensions;
	tables?: T;
	kyselyDatabase: {
		[K in keyof T]: T[K]["infer"];
	};
	instrospect: () => IntrospectedDatabase;
};

export function pgDatabase<T extends Record<string, AnyPgTable>>({
	extensions,
	tables,
}: {
	extensions?: PgExtensions;
	tables?: T;
}) {
	const tbl = tables !== undefined ? tables : ({} as T);
	const database = <pgDatabase<T>>{
		extensions: extensions !== undefined ? extensions : [],
		tables: tbl,
		instrospect: () => {
			return Object.entries(tbl).reduce(
				(acc, [name, table]) => {
					acc.tables[name] = tableInfo(table).introspect();
					return acc;
				},
				{ tables: {} } as IntrospectedDatabase,
			);
		},
	};
	for (const [, table] of Object.entries(tbl)) {
		Object.defineProperty(table, "database", {
			value: database,
			writable: false,
		});
	}
	return database;
}

export type AnyPgDatabase = pgDatabase<Record<string, AnyPgTable>>;

type IntrospectedDatabase = {
	tables: Record<string, IntrospectedTable>;
};
