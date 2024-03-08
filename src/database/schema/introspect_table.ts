import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import { compileDefaultExpression } from "../introspection/local_schema.js";
import {
	PgBigSerial,
	PgSerial,
	isExpression,
	type ColumnInfo,
} from "./pg_column.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { AnyPgTable, ColumnRecord, type PgTable } from "./pg_table.js";
import type {
	PgTrigger,
	TriggerEvent,
	TriggerFiringTime,
} from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type IntrospectedTable = {
	primaryKey: string[];
	columns: Record<string, IntrospectedColum>;
	foreignKeys: IntrospectedForeignKey[];
	uniqueConstraints: IntrospectedUniqueConstraint[];
	triggers: IntrospectionTrigger[];
};

export type IntrospectedColum = {
	dataType: string;
	nullable: boolean;
	generated: boolean;
	defaultValue: string | null;
	primaryKey: boolean;
};

export type IntrospectedForeignKey = {
	columns: string[];
	targetTable?: string;
	targetColumns?: string[];
	deleteRule?: ForeignKeyRule;
	updateRule?: ForeignKeyRule;
};

export type IntrospectedUniqueConstraint = {
	columns: string[];
	nullsDistinct: boolean;
};

export type IntrospectionTrigger = {
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

function findTableInSchema(
	table: AnyPgTable,
	tables?: Record<string, AnyPgTable>,
) {
	const tableInSchema = Object.entries(tables || {}).find(
		([, value]) => value.schema.columns === table.schema.columns,
	);
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
		acc.push(tr as unknown as IntrospectionTrigger);
		return acc;
	}, [] as IntrospectionTrigger[]);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uniqueConstraintInfo(uniqueConstraints?: PgUnique<any>[]) {
	return (uniqueConstraints || []).map<IntrospectedUniqueConstraint>((uc) => {
		return {
			columns: uc.compileArgs().cols,
			nullsDistinct: uc.compileArgs().nullsDistinct,
		};
	});
}
function foreignKeyInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	foreignKeys?: PgForeignKey<any>[],
	tables?: Record<string, AnyPgTable>,
) {
	return (foreignKeys || []).map<IntrospectedForeignKey>((fk) => {
		return {
			columns: fk.columns,
			targetTable: findTableInSchema(fk.targetTable, tables),
			targetColumns: fk.targetColumns,
			deleteRule: fk.options.deleteRule,
			updateRule: fk.options.updateRule,
		};
	});
}
function columnInfo(columns?: ColumnRecord) {
	return Object.entries(columns || {}).reduce(
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
function primaryKey(columns?: ColumnRecord) {
	return Object.entries(columns || {}).reduce((acc, [key, value]) => {
		const columnDef = Object.fromEntries(Object.entries(value)) as {
			_isPrimaryKey: boolean;
		};

		if (columnDef._isPrimaryKey) {
			acc.push(key);
		}
		return acc;
	}, [] as string[]);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function introspectTable(table: PgTable<any>) {
	const info: IntrospectedTable = {
		primaryKey: primaryKey(table.schema.columns),
		columns: columnInfo(table.schema.columns),
		foreignKeys: foreignKeyInfo(
			table.schema.foreignKeys,
			table.database?.tables,
		),
		uniqueConstraints: uniqueConstraintInfo(table.schema.uniqueConstraints),
		triggers: triggerInfo(table.schema.triggers),
	};
	return info;
}
