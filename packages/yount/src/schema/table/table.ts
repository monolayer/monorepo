import type { Simplify } from "kysely";
import type { InferColumnTypes } from "../inference.js";
import type { PgCheck } from "./constraints/check/check.js";
import type { PgForeignKey } from "./constraints/foreign-key/foreign-key.js";
import type { PgPrimaryKey } from "./constraints/primary-key/primary-key.js";
import type { PgUnique } from "./constraints/unique/unique.js";
import type { PgIndex } from "./index/index.js";
import type { ColumnRecord } from "./table-column.js";
import type { PgTrigger } from "./trigger/trigger.js";

export type TableSchema<T, PK extends string> = {
	columns: T extends ColumnRecord ? T : never;
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
	constraints?: {
		primaryKey?: keyof T extends string
			? PK[] extends Array<keyof T>
				? PgPrimaryKey<keyof T, PK>
				: PgPrimaryKey<keyof T, PK>
			: never;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		foreignKeys?: keyof T extends string ? PgForeignKey<keyof T, any>[] : [];
		unique?: keyof T extends string ? PgUnique<keyof T>[] : [];
		checks?: PgCheck[];
	};
};

export function table<T extends ColumnRecord, PK extends string>(
	tableSchema: TableSchema<T, PK>,
) {
	return new PgTable<T, PK>(tableSchema);
}

export class PgTable<T extends ColumnRecord, PK extends string> {
	declare infer: Simplify<InferColumnTypes<T, PK>>;
	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected schema: TableSchema<T, PK>,
	) {
		const columns = this.schema.columns;
		const primaryKey = this.schema.constraints?.primaryKey;
		if (primaryKey !== undefined) {
			const primaryKeyDef = Object.fromEntries(Object.entries(primaryKey)) as {
				columns: string[];
			};
			for (const key of primaryKeyDef.columns) {
				const pkColumn = columns[key];
				if (pkColumn !== undefined) {
					Object.defineProperty(pkColumn, "_primaryKey", {
						value: true,
						writable: false,
					});
				}
			}
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;
