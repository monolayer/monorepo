import { isExpression } from "kysely";
import { compileDefaultExpression } from "~/helpers/compile-default-expression.js";
import type { ColumnRecord } from "~/schema/column.js";
import type { ColumnInfo } from "~/schema/column/types.js";
import {
	type PgForeignKey,
	foreignKeyOptions,
	isExternalForeignKey,
} from "~/schema/foreign-key.js";
import { type AnySchema, Schema } from "~/schema/schema.js";
import type { AnyPgTable, PgTable, TableDefinition } from "~/schema/table.js";
import {
	type AnyTrigger,
	PgTrigger,
	type TriggerEvent,
	type TriggerFiringTime,
} from "~/schema/trigger.js";
import { type PgUnique, uniqueConstraintOptions } from "~/schema/unique.js";

export interface TableIntrospection {
	primaryKey: string[];
	columns: Record<string, ColumnInstrospection>;
	foreignKeys: ForeignKeyIntrospection[];
	uniqueConstraints: UniqueConstraintIntrospection[];
	triggers: TriggerInstrospection[];
}

export interface ColumnInstrospection {
	dataType: string;
	nullable: boolean;
	generated: boolean;
	defaultValue: string | null;
	primaryKey: boolean;
}

export type ForeignKeyRule =
	| "CASCADE"
	| "SET NULL"
	| "SET DEFAULT"
	| "RESTRICT"
	| "NO ACTION";

export interface ForeignKeyIntrospection {
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	deleteRule?: ForeignKeyRule;
	updateRule?: ForeignKeyRule;
	isExternal: boolean;
}

interface UniqueConstraintIntrospection {
	columns: string[];
	nullsDistinct: boolean;
}

interface TriggerInstrospection {
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
}

export function findTableInSchema(table: AnyPgTable, allSchemas: AnySchema[]) {
	const schemaTables = allSchemas.find(
		(schema) => Schema.info(schema).name === tableInfo(table).schemaName,
	)?.tables;
	const tableInSchema = Object.entries(schemaTables || {}).find(([, value]) => {
		return (
			tableInfo(value).definition.columns ===
			tableInfo(table).definition.columns
		);
	});
	if (tableInSchema !== undefined) {
		return tableInSchema[0];
	}
}

function triggerInfo(triggers?: AnyTrigger[]) {
	return Object.entries(triggers || {}).reduce((acc, [key, value]) => {
		const trigger = PgTrigger.info(value);
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
		acc.push(tr as unknown as TriggerInstrospection);
		return acc;
	}, [] as TriggerInstrospection[]);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uniqueConstraintInfo(uniqueConstraints?: PgUnique<any>[]) {
	return (uniqueConstraints || []).map<UniqueConstraintIntrospection>((uc) => {
		const options = uniqueConstraintOptions(uc);
		return {
			columns: options.columns,
			nullsDistinct: options.nullsDistinct,
		};
	});
}
function foreignKeyInfo(
	currentTable: AnyPgTable,
	allSchemas: AnySchema[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	foreignKeys?: PgForeignKey<any, any>[],
) {
	return (foreignKeys || []).map<ForeignKeyIntrospection>((fk) => {
		const options = foreignKeyOptions(fk);
		const isExternal = isExternalForeignKey(fk);
		const foreignKeyTargetTable = options.targetTable ?? currentTable;
		if (typeof foreignKeyTargetTable === "string") {
			return {
				columns: options.columns,
				targetTable: foreignKeyTargetTable,
				targetColumns: options.targetColumns,
				deleteRule: options.deleteRule,
				updateRule: options.updateRule,
				isExternal: isExternal,
			};
		} else {
			const targetTable =
				findTableInSchema(foreignKeyTargetTable, allSchemas) || "";
			const targetTableSchema = tableInfo(foreignKeyTargetTable).schemaName;
			return {
				columns: options.columns,
				targetTable: `${targetTableSchema}.${targetTable}`,
				targetColumns: options.targetColumns,
				deleteRule: options.deleteRule,
				updateRule: options.updateRule,
				isExternal: isExternal,
			};
		}
	});
}

function columnInfo(columns?: ColumnRecord) {
	return Object.entries(columns || {}).reduce(
		(acc, [key, value]) => {
			const columnDef = Object.fromEntries(Object.entries(value)) as {
				_primaryKey: boolean;
				info: ColumnInfo;
				_generatedColumn?: boolean;
			};
			let generated = false;
			if (columnDef.info.identity !== null) {
				generated = true;
			}
			if (columnDef._generatedColumn === true) {
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
					!columnDef._primaryKey,
				generated,
				defaultValue:
					defaultValue === null ? defaultValue : String(defaultValue),
				primaryKey: columnDef._primaryKey,
			};
			return acc;
		},
		{} as Record<string, ColumnInstrospection>,
	);
}
function primaryKey(columns?: ColumnRecord) {
	return Object.entries(columns || {}).reduce((acc, [key, value]) => {
		const columnDef = Object.fromEntries(Object.entries(value)) as {
			_primaryKey: boolean;
		};

		if (columnDef._primaryKey) {
			acc.push(key);
		}
		return acc;
	}, [] as string[]);
}

export function introspectTable(table: AnyPgTable, allSchemas: AnySchema[]) {
	const info = tableInfo(table);
	const defininition = info.definition;
	const triggers = (defininition.triggers ??
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[]) as PgTrigger<any>[];

	const introspectedTable: TableIntrospection = {
		primaryKey: primaryKey(defininition.columns),
		columns: columnInfo(defininition.columns),
		foreignKeys: foreignKeyInfo(
			table,
			allSchemas,
			defininition.constraints?.foreignKeys,
		).filter((fk) => fk.isExternal === false),
		uniqueConstraints: uniqueConstraintInfo(defininition.constraints?.unique),
		triggers: triggerInfo(triggers),
	};
	return introspectedTable;
}

type InferTableDefinition<T extends AnyPgTable> =
	T extends PgTable<infer C, infer PK> ? TableDefinition<C, PK> : never;

export function tableInfo<T extends AnyPgTable>(table: T) {
	const info = Object.fromEntries(Object.entries(table)) as unknown as {
		definition: InferTableDefinition<T>;
		schemaName: string;
		introspect(allSchemas: AnySchema[]): TableIntrospection;
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info.schemaName = (table as any).schemaName;
	info.introspect = (allSchemas: AnySchema[]) => {
		return introspectTable(table, allSchemas);
	};
	return info;
}