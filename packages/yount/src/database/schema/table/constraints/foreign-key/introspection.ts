import { sql, type Kysely, type OnModifyForeignAction } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { tableInfo } from "~/introspection/helpers.js";
import { previousTableName } from "~/introspection/table-name.js";
import {
	findTableByNameInDatabaseSchema,
	type ForeignKeyInfo,
} from "~/migrations/migration-schema.js";
import type { TablesToRename } from "~/programs/table-diff-prompt.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../../introspection/types.js";

export type ForeignKeyRule =
	| "CASCADE"
	| "SET NULL"
	| "SET DEFAULT"
	| "RESTRICT"
	| "NO ACTION";

export type ForeignKeyConstraintInfo = {
	constraintType: "FOREIGN KEY";
	table: string | null;
	column: string[];
	targetTable: string | null;
	targetColumns: string[];
	deleteRule: ForeignKeyRule | null;
	updateRule: ForeignKeyRule | null;
};

export async function dbForeignKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return {};
	}

	const results = await kysely
		.selectFrom("pg_constraint as con")
		.fullJoin("pg_class as tbl", (join) =>
			join.onRef("tbl.oid", "=", "con.conrelid"),
		)
		.fullJoin("pg_namespace as ns", (join) =>
			join.onRef("ns.oid", "=", "tbl.relnamespace"),
		)
		.fullJoin("pg_attribute as col", (join) =>
			join
				.onRef("col.attrelid", "=", "tbl.oid")
				.on("col.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("pg_class as ref_tbl", (join) =>
			join.onRef("con.confrelid", "=", "ref_tbl.oid"),
		)
		.fullJoin("pg_attribute as relcol", (join) =>
			join
				.onRef("relcol.attrelid", "=", "ref_tbl.oid")
				.on("relcol.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("information_schema.referential_constraints as rc", (join) =>
			join.onRef("rc.constraint_name", "=", "con.conname"),
		)
		.fullJoin("information_schema.constraint_column_usage as cu", (join) =>
			join.onRef("cu.constraint_name", "=", "con.conname"),
		)
		.select([
			"con.conname",
			sql<"FOREIGN KEY">`'FOREIGN KEY'`.as("constraintType"),
			"tbl.relname as table",
			sql<string[]>`JSON_AGG(DISTINCT col.attname)`.as("column"),
			"ref_tbl.relname as targetTable",
			sql<string[]>`JSON_AGG(DISTINCT cu.column_name)`.as("targetColumns"),
			"rc.delete_rule as deleteRule",
			"rc.update_rule as updateRule",
		])
		.where("con.contype", "=", "f")
		.where("ns.nspname", "=", databaseSchema)
		.where("con.conname", "~", "yount_fk$")
		.where("tbl.relname", "in", tableNames)
		.groupBy([
			"tbl.relname",
			"ref_tbl.relname",
			"rc.delete_rule",
			"rc.update_rule",
			"con.confrelid",
			"con.conname",
		])
		.execute();
	const transformedResults = results.reduce<ForeignKeyInfo>((acc, result) => {
		const constraintHash = result.conname!.match(/^\w+_(\w+)_yount_fk$/)![1];
		const query = foreignKeyConstraintInfoToNameAndQuery(
			result,
			constraintHash,
		);
		const table = result.table;
		if (table !== null) {
			acc[table] = {
				...acc[table],
				...query,
			};
		}
		return acc;
	}, {});
	return transformedResults;
}

export function localForeignKeyConstraintInfo(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	tablesToRename: TablesToRename = [],
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce<ForeignKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const introspect = tableInfo(tableDefinition).introspect(tables);
			const foreignKeys = introspect.foreignKeys;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const targetTableName = findTableByNameInDatabaseSchema(
						foreignKey.targetTable,
						schema,
						camelCase,
					);
					const transformedColumNames = foreignKey.columns.map((column) =>
						toSnakeCase(column, camelCase),
					);

					const transformedtargetColumnNames = foreignKey.targetColumns.map(
						(column) => toSnakeCase(column, camelCase),
					);
					if (targetTableName !== undefined) {
						const query = foreignKeyConstraintInfoToNameAndQuery({
							constraintType: "FOREIGN KEY",
							table: transformedTableName,
							column: transformedColumNames,
							targetTable: previousTableName(targetTableName, tablesToRename),
							targetColumns: transformedtargetColumnNames,
							deleteRule: foreignKey.deleteRule ?? null,
							updateRule: foreignKey.updateRule ?? null,
						});
						acc[transformedTableName] = {
							...acc[transformedTableName],
							...query,
						};
					}
				}
			}
			return acc;
		},
		{},
	);
}

export function foreignKeyConstraintInfoToNameAndQuery(
	info: ForeignKeyConstraintInfo,
	hash?: string,
) {
	const parts = [
		"FOREIGN KEY",
		`(${info.column.map((col) => `"${col}"`).join(", ")})`,
		"REFERENCES",
		info.targetTable,
		`(${info.targetColumns.map((col) => `"${col}"`).join(", ")})`,
		`ON DELETE ${info.deleteRule}`,
		`ON UPDATE ${info.updateRule}`,
	];
	return {
		[`${hash !== undefined ? hash : hashValue(parts.join(" "))}`]:
			parts.join(" "),
	};
}

export type ForeIgnKeyConstraintInfo = {
	table: string;
	column: string;
	options: `${OnModifyForeignAction};${OnModifyForeignAction}`;
};
