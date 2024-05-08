import {
	compileDefaultExpression,
	tableInfo,
} from "~/introspection/helpers.js";
import { Schema, type AnySchema } from "./schema.js";
import { isExpression } from "./table/column/column.js";
import { type ColumnInfo } from "./table/column/types.js";
import {
	foreignKeyOptions,
	isExternalForeignKey,
	type PgForeignKey,
} from "./table/constraints/foreign-key/foreign-key.js";
import {
	uniqueConstraintOptions,
	type PgUnique,
} from "./table/constraints/unique/unique.js";
import { ColumnRecord } from "./table/table-column.js";
import type { AnyPgTable } from "./table/table.js";
import {
	PgTrigger,
	TriggerEvent,
	TriggerFiringTime,
	type AnyTrigger,
} from "./table/trigger/trigger.js";

export interface TableIntrospection {
	primaryKey: string[];
	columns: Record<string, ColumnInstrospection>;
	foreignKeys: ForeignKeyIntrospection[];
	uniqueConstraints: UniqueConstraintIntrospection[];
	triggers: TriggerInstrospection[];
}

interface ColumnInstrospection {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function introspectTable(table: AnyPgTable, allSchemas: AnySchema[]) {
	const info = tableInfo(table);
	const defininition = info.definition;
	const introspectedTable: TableIntrospection = {
		primaryKey: primaryKey(defininition.columns),
		columns: columnInfo(defininition.columns),
		foreignKeys: foreignKeyInfo(
			table,
			allSchemas,
			defininition.constraints?.foreignKeys,
		).filter((fk) => fk.isExternal === false),
		uniqueConstraints: uniqueConstraintInfo(defininition.constraints?.unique),
		triggers: triggerInfo(defininition.triggers),
	};
	return introspectedTable;
}
