import type { Simplify } from "kysely";
import { PgCheck, type PgUnmanagedCheck } from "~/schema/check.js";
import type { ColumnRecord } from "~/schema/column.js";
import type {
	PgForeignKey,
	PgSelfReferentialForeignKey,
	PgUnmanagedForeignKey,
} from "~/schema/foreign-key.js";
import { type PgIndex, PgUnmanagedIndex } from "~/schema/index.js";
import type { InferColumnTypes } from "~/schema/inference.js";
import type { PgPrimaryKey } from "~/schema/primary-key.js";
import { type PgTrigger, PgUnmanagedTrigger } from "~/schema/trigger.js";
import type { PgUnique } from "~/schema/unique.js";

export type TableDefinition<T, PK extends string> = {
	columns: T extends ColumnRecord ? T : never;
	indexes?: keyof T extends string
		? (PgIndex<keyof T> | PgUnmanagedIndex)[]
		: never;
	triggers?: Array<
		| PgTrigger<keyof T extends string ? keyof T : never>
		| PgTrigger<never>
		| PgUnmanagedTrigger
	>;
	constraints?: {
		primaryKey?: keyof T extends string
			? PK[] extends Array<keyof T>
				? PgPrimaryKey<keyof T, PK>
				: PgPrimaryKey<keyof T, PK>
			: never;
		foreignKeys?: keyof T extends string
			? Array<
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					| PgForeignKey<keyof T, any>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					| PgSelfReferentialForeignKey<keyof T, any>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					| PgUnmanagedForeignKey<keyof T, any>
				>
			: [];
		unique?: keyof T extends string ? PgUnique<keyof T>[] : [];
		checks?: (PgCheck | PgUnmanagedCheck)[];
	};
};

export function table<T extends ColumnRecord, PK extends string>(
	definition: TableDefinition<T, PK>,
) {
	return new PgTable<T, PK>(definition);
}

export class PgTable<T extends ColumnRecord, PK extends string> {
	declare infer: Simplify<InferColumnTypes<T, PK>>;

	/**
	 * @hidden
	 */
	protected schemaName?: string;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected definition: TableDefinition<T, PK>,
	) {
		const columns = this.definition.columns;
		const primaryKey = this.definition.constraints?.primaryKey;
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
		this.definition.constraints = {
			...this.definition.constraints,
			checks: (this.definition.constraints?.checks ?? []).filter(
				(check): check is PgCheck => (check instanceof PgCheck ? true : false),
			),
		};

		this.definition.indexes = (this.definition.indexes ?? []).filter(
			(index): index is PgIndex<string & keyof T> =>
				index instanceof PgUnmanagedIndex ? false : true,
		) as keyof T extends string ? PgIndex<keyof T>[] : never;

		this.definition.triggers = (this.definition.triggers ?? []).filter(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(index): index is PgTrigger<any> =>
				index instanceof PgUnmanagedTrigger ? false : true,
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;
