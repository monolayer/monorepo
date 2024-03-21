import {
	compileDefaultExpression,
	tableInfo,
} from "~/introspection/helpers.js";
import { isExpression } from "./column/column.js";
import { type ColumnInfo } from "./column/types.js";
import {
	foreignKeyOptions,
	isExternalForeignKey,
	type PgForeignKey,
} from "./foreign-key/foreign-key.js";
import type { ForeignKeyRule } from "./foreign-key/introspection.js";
import { ColumnRecord } from "./table/table-column.js";
import type { AnyPgTable } from "./table/table.js";
import {
	PgTrigger,
	TriggerEvent,
	TriggerFiringTime,
} from "./trigger/trigger.js";
import { uniqueConstraintOptions, type PgUnique } from "./unique/unique.js";

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	foreignKeys?: PgForeignKey<any, any>[],
	tables?: Record<string, AnyPgTable>,
) {
	return (foreignKeys || []).map<ForeignKeyIntrospection>((fk) => {
		const options = foreignKeyOptions(fk);
		const isExternal = isExternalForeignKey(fk);
		return {
			columns: options.columns as string[],
			targetTable: findTableInSchema(options.targetTable, tables) || "",
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
export function introspectTable(
	table: AnyPgTable,
	dbTables?: Record<string, AnyPgTable>,
) {
	const info = tableInfo(table);
	const schema = info.schema;
	const introspectedTable: TableIntrospection = {
		primaryKey: primaryKey(schema.columns),
		columns: columnInfo(schema.columns),
		foreignKeys: foreignKeyInfo(
			schema.constraints?.foreignKeys,
			dbTables || {},
		).filter((fk) => fk.isExternal === false),
		uniqueConstraints: uniqueConstraintInfo(schema.constraints?.unique),
		triggers: triggerInfo(schema.triggers),
	};
	return introspectedTable;
}
