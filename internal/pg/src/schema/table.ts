import type { Simplify } from "kysely";
import { PgCheck, PgMappedCheck } from "~pg/schema/check.js";
import type { ColumnRecord } from "~pg/schema/column.js";
import {
	PgForeignKey,
	PgMappedForeignKey,
	PgSelfReferentialForeignKey,
} from "~pg/schema/foreign-key.js";
import { type PgIndex, PgMappedIndex } from "~pg/schema/index.js";
import type { InferColumnTypes } from "~pg/schema/inference.js";
import type { PgPrimaryKey } from "~pg/schema/primary-key.js";
import { PgMappedTrigger, type PgTrigger } from "~pg/schema/trigger.js";
import type { PgUnique } from "~pg/schema/unique.js";

/**
 * @group Classes, Types, and Interfaces
 * @category Types and Interfaces
 */
export type TableDefinition<T, PK extends string> = {
	columns?: T extends ColumnRecord ? T : never;
	indexes?: keyof T extends string
		? (PgIndex<keyof T> | PgMappedIndex)[]
		: never;
	triggers?: Array<
		| PgTrigger<keyof T extends string ? keyof T : never>
		| PgTrigger<never>
		| PgMappedTrigger
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
					| PgMappedForeignKey
				>
			: [];
		unique?: keyof T extends string ? PgUnique<keyof T>[] : [];
		checks?: (PgCheck | PgMappedCheck)[];
	};
};

/**
 * @group Schema Definition
 * @category Database and Tables
 */
export function table<T extends ColumnRecord, PK extends string>(
	definition: TableDefinition<T, PK>,
) {
	return new PgTable<T, PK>(definition);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgTable<T extends ColumnRecord, PK extends string> {
	declare infer: Simplify<InferColumnTypes<T, PK>>;

	/**
	 * @hidden
	 */
	columns: ColumnRecord;
	/**
	 * @hidden
	 */
	protected schemaName?: string;

	/**
	 * @hidden
	 */
	mapped: string[];

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected definition: TableDefinition<T, PK>,
	) {
		this.mapped = mappedObjects(this.definition);

		this.columns = this.definition.columns || ({} as ColumnRecord);
		const primaryKey = this.definition.constraints?.primaryKey;
		if (primaryKey !== undefined) {
			const primaryKeyDef = Object.fromEntries(Object.entries(primaryKey)) as {
				columns: string[];
			};
			for (const key of primaryKeyDef.columns) {
				const pkColumn = this.columns[key];
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
			foreignKeys: (this.definition.constraints?.foreignKeys ?? []).filter(
				(foreignKey) =>
					foreignKey.constructor.name === "PgMappedForeignKey" ? false : true,
			) as keyof T extends string ? AnyPgForeignKey<T>[] : [],
		};
		this.definition.indexes = (this.definition.indexes ?? []).filter(
			(index): index is PgIndex<string & keyof T> =>
				index instanceof PgMappedIndex ? false : true,
		) as keyof T extends string ? PgIndex<keyof T>[] : never;

		this.definition.triggers = (this.definition.triggers ?? []).filter(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(index): index is PgTrigger<any> =>
				index instanceof PgMappedTrigger ? false : true,
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mappedObjects<T>(definition: TableDefinition<T, any>) {
	return [
		...(
			(definition.constraints?.foreignKeys ?? []).filter((foreignKey) =>
				foreignKey.constructor.name === "PgMappedForeignKey" ? true : false,
			) as PgMappedForeignKey[]
		).map((foreignKey) => foreignKey.name),
		...(
			(definition.constraints?.checks ?? []).filter((index) =>
				index.constructor.name === "PgMappedCheck" ? true : false,
			) as PgMappedCheck[]
		).map((check) => check.name),
		...(
			(definition.indexes ?? []).filter((index) =>
				index.constructor.name === "PgMappedIndex" ? true : false,
			) as PgMappedIndex[]
		).map((index) => index.name),
		...(
			(definition.triggers ?? []).filter((index) =>
				index.constructor.name === "PgMappedTrigger" ? true : false,
			) as PgMappedTrigger[]
		).map((trigger) => trigger.name),
	];
}

type AnyPgForeignKey<T> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| PgForeignKey<string & keyof T, any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| PgSelfReferentialForeignKey<string & keyof T, any>;
