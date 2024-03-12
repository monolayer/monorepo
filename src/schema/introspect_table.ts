import type { ForeignKeyRule } from "../introspection/foreign_key_constraint.js";
import { compileDefaultExpression } from "../introspection/schemas.js";
import {
	PgBigSerial,
	PgSerial,
	isExpression,
	type ColumnInfo,
} from "./pg_column.js";
import { PgDatabase, type AnyPgDatabase } from "./pg_database.js";
import { foreignKeyOptions, type PgForeignKey } from "./pg_foreign_key.js";
import { AnyPgTable, ColumnRecord, tableInfo } from "./pg_table.js";
import type {
	PgTrigger,
	TriggerEvent,
	TriggerFiringTime,
} from "./pg_trigger.js";
import { uniqueConstraintOptions, type PgUnique } from "./pg_unique.js";

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

interface ForeignKeyIntrospection {
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	deleteRule?: ForeignKeyRule;
	updateRule?: ForeignKeyRule;
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

function findTableInSchema(
	table: AnyPgTable,
	tables?: Record<string, AnyPgTable>,
) {
	const tableInSchema = Object.entries(tables || {}).find(([, value]) => {
		return tableInfo(value).schema.columns === tableInfo(table).schema.columns;
	});
	if (tableInSchema !== undefined) {
		return tableInSchema[0];
	}
}
function triggerInfo(triggers?: Record<string, PgTrigger>) {
	return Object.entries(triggers || {}).reduce((acc, [key, value]) => {
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	foreignKeys?: PgForeignKey<any, any>[],
	tables?: Record<string, AnyPgTable>,
) {
	return (foreignKeys || []).map<ForeignKeyIntrospection>((fk) => {
		const options = foreignKeyOptions(fk);

		return {
			columns: options.columns as string[],
			targetTable: findTableInSchema(options.targetTable, tables) || "",
			targetColumns: options.targetColumns,
			deleteRule: options.deleteRule,
			updateRule: options.updateRule,
		};
	});
}
function columnInfo(columns?: ColumnRecord) {
	return Object.entries(columns || {}).reduce(
		(acc, [key, value]) => {
			const columnDef = Object.fromEntries(Object.entries(value)) as {
				_primaryKey: boolean;
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
export function introspectTable(table: AnyPgTable) {
	const info = tableInfo(table);
	const schema = info.schema;
	const introspectedTable: TableIntrospection = {
		primaryKey: primaryKey(schema.columns),
		columns: columnInfo(schema.columns),
		foreignKeys: foreignKeyInfo(
			schema.constraints?.foreignKeys,
			PgDatabase.info(info.database || ({} as AnyPgDatabase)).tables,
		),
		uniqueConstraints: uniqueConstraintInfo(schema.constraints?.unique),
		triggers: triggerInfo(schema.triggers),
	};
	return introspectedTable;
}
