import type { Insertable, Selectable, Simplify, Updateable } from "kysely";
import { z } from "zod";
import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import { compileDefaultExpression } from "../introspection/local_schema.js";
import {
	PgBigSerial,
	PgColumnTypes,
	PgSerial,
	isExpression,
	type ColumnInfo,
	type GeneratedColumnType,
	type InferColumType,
	type PgColumn,
	type PgGeneratedColumn,
} from "./pg_column.js";
import type { AnyPgDatabase } from "./pg_database.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type {
	PgTrigger,
	TriggerEvent,
	TriggerFiringTime,
} from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

type TableSchema<T> = {
	columns: T extends ColumnRecord ? T : never;
	foreignKeys?: PgForeignKey<keyof T | Array<keyof T>>[];
	uniqueConstraints?: keyof T extends string ? PgUnique<keyof T>[] : [];
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<T extends ColumnRecord>(schema: TableSchema<T>) {
	return new PgTable(schema);
}

export class PgTable<T extends ColumnRecord> {
	declare infer: Simplify<InferColumTypes<T>>;

	declare inferSelect: Selectable<typeof this.infer>;
	declare inferInsert: Simplify<Insertable<typeof this.infer>>;
	declare inferUpdate: Simplify<Updateable<typeof this.infer>>;

	database?: AnyPgDatabase;

	constructor(public schema: TableSchema<T>) {
		this.schema.indexes = schema.indexes || [];
		this.schema.columns = schema.columns || {};
		this.schema.foreignKeys = schema.foreignKeys;
		this.schema.uniqueConstraints = schema.uniqueConstraints || [];
		this.schema.triggers = this.schema.triggers || {};
	}

	zodSchema() {
		const cols = this.schema.columns as ColumnRecord;
		const schema = Object.entries(cols).reduce(
			(acc, [key, value]) => {
				return acc.extend({
					[key]: value.zodSchema(),
				}) as ZodSchemaObject<T>;
			},
			z.object({}) as ZodSchemaObject<T>,
		);
		return z.object(schema.shape);
	}

	introspect() {
		const info: IntrospectedTable = {
			primaryKey: this.#primaryKey(),
			columns: this.#columnInfo(),
			foreignKeys: this.#foreignKeyInfo(),
			uniqueConstraints: this.#uniqueConstraintInfo(),
			triggers: this.#triggerInfo(),
		};
		return info;
	}

	#primaryKey() {
		return Object.entries(this.schema.columns).reduce((acc, [key, value]) => {
			const columnDef = Object.fromEntries(Object.entries(value)) as {
				_isPrimaryKey: boolean;
			};

			if (columnDef._isPrimaryKey) {
				acc.push(key);
			}
			return acc;
		}, [] as string[]);
	}

	#columnInfo() {
		return Object.entries(this.schema.columns).reduce(
			(acc, [key, value]) => {
				const columnDef = Object.fromEntries(Object.entries(value)) as {
					_isPrimaryKey: boolean;
					info: ColumnInfo;
				};
				let generated = false;
				if (columnDef.info.identity !== null) {
					generated = true;
				}
				if (value instanceof PgSerial || value instanceof PgBigSerial) {
					generated = true;
				}
				let defaultValue = columnDef.info.defaultValue;
				if (isExpression(defaultValue)) {
					defaultValue = `sql\`${compileDefaultExpression(defaultValue)}\``;
				}
				acc[key] = {
					dataType: columnDef.info.dataType,
					nullable:
						columnDef.info.isNullable &&
						columnDef.info.identity === null &&
						!columnDef._isPrimaryKey,
					generated,
					defaultValue:
						defaultValue === null ? defaultValue : String(defaultValue),
					primaryKey: columnDef._isPrimaryKey,
				};
				return acc;
			},
			{} as Record<string, IntrospectedColum>,
		);
	}

	#foreignKeyInfo() {
		return (this.schema.foreignKeys || []).map<IntrospectedForeignKey>((fk) => {
			return {
				columns: fk.columns,
				targetTable: this.#findTableInDatabaseSchema(fk.targetTable),
				targetColumns: fk.targetColumns,
				deleteRule: fk.options.deleteRule,
				updateRule: fk.options.updateRule,
			};
		});
	}

	#uniqueConstraintInfo() {
		return (
			this.schema.uniqueConstraints || []
		).map<IntrospectedUniqueConstraint>((uc) => {
			return {
				columns: uc.compileArgs().cols,
				nullsDistinct: uc.compileArgs().nullsDistinct,
			};
		});
	}

	#triggerInfo() {
		return Object.entries(this.schema.triggers || {}).reduce(
			(acc, [key, value]) => {
				const trigger = value.compileArgs();
				const tr = Object.entries(trigger).reduce(
					(acc, [key, value]) => {
						if (value === undefined) {
							return acc;
						}
						acc[key] = value;
						return acc;
					},
					{} as Record<string, unknown>,
				);
				if (trigger.condition !== undefined) {
					tr.condition = compileDefaultExpression(trigger.condition);
				}
				tr.name = key;
				acc.push(tr as unknown as IntrospectionTrigger);
				return acc;
			},
			[] as IntrospectionTrigger[],
		);
	}

	#findTableInDatabaseSchema(table: AnyPgTable) {
		const tableInSchema = Object.entries(this.database?.tables || {}).find(
			([, value]) => value.schema.columns === table.schema.columns,
		);
		if (tableInSchema !== undefined) {
			return tableInSchema[0];
		}
	}
}

export type IntrospectedTable = {
	primaryKey: string[];
	columns: Record<string, IntrospectedColum>;
	foreignKeys: IntrospectedForeignKey[];
	uniqueConstraints: IntrospectedUniqueConstraint[];
	triggers: IntrospectionTrigger[];
};

type IntrospectedColum = {
	dataType: string;
	nullable: boolean;
	generated: boolean;
	defaultValue: string | null;
	primaryKey: boolean;
};

type IntrospectedForeignKey = {
	columns: string[];
	targetTable?: string;
	targetColumns?: string[];
	deleteRule?: ForeignKeyRule;
	updateRule?: ForeignKeyRule;
};

type IntrospectedUniqueConstraint = {
	columns: string[];
	nullsDistinct: boolean;
};

type IntrospectionTrigger = {
	name: string;
	firingTime: TriggerFiringTime;
	events: TriggerEvent[];
	columns?: string[];
	referencingNewTableAs?: string;
	referencingOldTableAs?: string;
	condition?: string;
	forEach: "row" | "statement";
	functionName: string;
	functionArgs?: {
		value: string;
		columnName?: true;
	};
};

type ZodSchemaObject<T extends ColumnRecord> = z.ZodObject<
	{
		[K in keyof T]: ReturnType<T[K]["zodSchema"]>;
	},
	"strip",
	z.ZodTypeAny,
	{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[K in keyof T]: any;
	}
>;

export type InferColumTypes<T extends ColumnRecord> = Simplify<{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[P in keyof T]: T[P] extends PgColumn<any, any>
		? InferColumType<T[P]>
		: T[P] extends PgGeneratedColumn<infer S, infer U>
			? GeneratedColumnType<S, U, U>
			: never;
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any>;
