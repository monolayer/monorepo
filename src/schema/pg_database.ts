import { type IntrospectedTable } from "./introspect_table.js";
import type { PgExtensions } from "./pg_extension.js";
import { tableInfo, type AnyPgTable } from "./pg_table.js";

export type DatabaseSchema<T> = {
	extensions?: PgExtensions;
	tables?: T;
};

export class PgDatabase<T extends Record<string, AnyPgTable>> {
	declare infer: {
		[K in keyof T]: T[K]["infer"];
	};

	/**
	 * @hidden
	 */
	protected extensions?: PgExtensions;
	/**
	 * @hidden
	 */
	protected tables?: T;

	/**
	 * @hidden
	 */
	constructor(schema: DatabaseSchema<T>) {
		this.tables = schema.tables;
		this.extensions = schema.extensions;
		for (const [, table] of Object.entries(schema.tables || {})) {
			Object.defineProperty(table, "database", {
				value: this,
				writable: false,
			});
		}
	}

	instrospect() {
		const tables = Object.entries(this.tables || {}).reduce(
			(acc, [name, table]) => {
				acc[name] = tableInfo(table).introspect();
				return acc;
			},
			{} as Record<string, IntrospectedTable>,
		);

		const introspectedDatabase: IntrospectedDatabase = {
			tables,
			extensions: this.extensions ?? [],
		};
		return introspectedDatabase;
	}
}

export function pgDatabase<T extends Record<string, AnyPgTable>>(
	schema: DatabaseSchema<T>,
) {
	return new PgDatabase(schema);
}

export type AnyPgDatabase = PgDatabase<Record<string, AnyPgTable>>;

type IntrospectedDatabase = {
	extensions: Array<string>;
	tables: Record<string, IntrospectedTable>;
};

export function databaseInfo(database: AnyPgDatabase) {
	return Object.fromEntries(Object.entries(database)) as {
		extensions?: PgExtensions;
		tables?: Record<string, AnyPgTable>;
	};
}
