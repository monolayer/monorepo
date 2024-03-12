import type { PgExtensions } from "./pg_extension.js";
import { type AnyPgTable } from "./pg_table.js";

export type DatabaseSchema<T> = {
	extensions?: PgExtensions;
	tables?: T;
};

export class PgDatabase<T extends ColumnRecord> {
	/**
	 * @hidden
	 */
	static info(db: AnyPgDatabase) {
		return {
			extensions: db.#extensions ?? [],
			tables: db.#tables ?? {},
		};
	}

	declare infer: {
		[K in keyof T]: T[K]["infer"];
	};

	/**
	 * @hidden
	 */
	#extensions?: PgExtensions;
	/**
	 * @hidden
	 */
	#tables?: T;

	/**
	 * @hidden
	 */
	constructor(schema: DatabaseSchema<T>) {
		this.#tables = schema.tables;
		this.#extensions = schema.extensions;
		for (const [, table] of Object.entries(schema.tables || {})) {
			Object.defineProperty(table, "database", {
				value: this,
				writable: false,
			});
		}
	}
}

export function pgDatabase<T extends ColumnRecord>(schema: DatabaseSchema<T>) {
	return new PgDatabase(schema);
}

export type AnyPgDatabase = PgDatabase<ColumnRecord>;

type ColumnRecord = Record<string, AnyPgTable>;
