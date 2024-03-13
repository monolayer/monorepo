import type { EnumType } from "./pg_enumerated.js";
import type { PgExtension } from "./pg_extension.js";
import type { AnyPgTable } from "./pg_table.js";

export type DatabaseSchema<T extends ColumnRecord> = {
	extensions?: Array<PgExtension>;
	tables?: T;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	types?: Array<EnumType<any>>;
};

export class PgDatabase<T extends ColumnRecord> {
	/**
	 * @hidden
	 */
	static info(db: AnyPgDatabase) {
		return {
			extensions: db.#extensions ?? [],
			tables: db.#tables ?? {},
			types: db.#types || [],
		};
	}

	/**
	 * Infers the Kysely database schema type definition database with differents type for select, insert and update operations.
	 *
	 * The inference takes into account column default values and constraints (not null, primary key) to infer the appropriate type for the database operations.
	 *
	 * The type should be used as thedDatabase interface for the `Kysely` instance.
	 *
	 * @remarks
	 * This property does not contain any value. Should be used only as a type with `typeof`.
	 *
	 * @example
	 *
	 * Given this database schema:
	 *
	 * ```ts
	 * const database = pgDatabase({
	 *   tables: {
	 *     users: table({
	 *       columns: {
	 *         id: integer().generatedByDefaultAsIdentity(),
	 *         name: varchar().notNull(),
	 *       }
	 *     }),
	 *     books: table({
	 *       id: integer().generatedByDefaultAsIdentity(),
	 *       title: varchar(),
	 *       copies: int2().notNull().default(0),
	 *     }),
	 *   }
	 * });
	 * ```
	 *
	 * Inferring the database type with:
	 *
	 * ```ts
	 * type DB = typeof database.infer;
	 * ```
	 *
	 * will result in the following type:
	 *
	 * ```ts
	 * type DB = {
	 *   users: {
	 *     id: {
	 *       readonly __select__: number;
	 *       readonly __insert__: string | number | undefined;
	 *       readonly __update__: string | number;
	 *     };
	 *     name: {
	 *       readonly __select__: string;
	 *       readonly __insert__: string;
	 *       readonly __update__: string;
	 *     };
	 *   };
	 *   books: {
	 *     id: {
	 *       readonly __select__: number;
	 *       readonly __insert__: string | number | undefined;
	 *       readonly __update__: string | number;
	 *     };
	 *     title: {
	 *       readonly __select__: string | null;
	 *       readonly __insert__: string | null | undefined;
	 *       readonly __update__: string | null;
	 *     };
	 *     copies: {
	 *       readonly __select__: number;
	 *       readonly __insert__: string | number | undefined;
	 *       readonly __update__: string | number;
	 *     };
	 *   };
	 * };
	 * ```
	 */
	declare infer: {
		[K in keyof T]: T[K]["infer"];
	};

	/**
	 * @hidden
	 */
	#extensions?: Array<PgExtension>;
	/**
	 * @hidden
	 */
	#tables?: T;

	/**
	 * @hidden
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#types?: Array<EnumType<any>>;

	/**
	 * @hidden
	 */
	constructor(schema: DatabaseSchema<T>) {
		this.#tables = schema.tables;
		this.#extensions = schema.extensions;
		this.#types = schema.types;
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
