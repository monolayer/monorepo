import { assert } from "vitest";
import type { TestContext } from "../setup.js";

function splitQualifiedName(str: string) {
	return str.split(".");
}

export const assertDb = (context: TestContext) => {
	return {
		table: async (qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.tables")
				.select("table_name")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.execute();
			assert(
				result.length !== 0,
				`Table "${tableName}" not in "${schemaName}" schema`,
			);
		},
		column: async (
			columnName: string,
			dataType: string,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select(["table_name", "column_name", "data_type"])
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.data_type === dataType,
				`Expected '${columnName}' to have data type ${dataType}. Actual ${result[0]?.data_type}`,
			);
		},
		columnNullable: async (columnName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("is_nullable")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.is_nullable === "YES",
				`Expected column '${columnName}' to be nullable`,
			);
		},
		columnDefault: async (
			columnName: string,
			columnDefault: string | null,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("column_default")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.column_default === columnDefault,
				`Expected column '${columnName}' to have a default of ${columnDefault}. Actual: ${result[0]?.column_default}`,
			);
		},
		columnWithIdentity: async (
			columnName: string,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("is_identity")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.is_identity === "YES",
				`Expected column '${columnName}' to be an identity column.`,
			);
		},
		constraint: async (constraintName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.table_constraints")
				.select("constraint_name")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("constraint_name", "=", constraintName)
				.execute();
			assert(
				result.length !== 0,
				`Constraint "${constraintName}" not in "${schemaName}"."${tableName}"`,
			);
		},
		index: async (indexName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("pg_indexes")
				.select("indexname")
				.where("schemaname", "=", schemaName)
				.where("tablename", "=", tableName)
				.where("indexname", "=", indexName)
				.execute();
			assert(
				result.length !== 0,
				`Index "${indexName}" not in "${schemaName}"."${tableName}"`,
			);
		},
	};
};

export const refuteDb = (context: TestContext) => {
	return {
		table: async (qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.tables")
				.select("table_name")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.execute();
			assert(
				result.length === 0,
				`Table "${tableName}" in "${schemaName}" schema`,
			);
		},
		column: async (
			columnName: string,
			dataType: string,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select(["table_name", "column_name", "data_type"])
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length === 0,
				`Column '${columnName}' in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.data_type !== dataType,
				`Expected '${columnName}' not to have data type ${dataType}`,
			);
		},
		columnNullable: async (columnName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("is_nullable")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.is_nullable === "NO",
				`Expected column '${columnName}' to be non nullable`,
			);
		},
		columnDefault: async (
			columnName: string,
			columnDefault: string | null,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("column_default")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length === 0,
				`Column '${columnName}' in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.column_default !== columnDefault,
				`Expected column '${columnName}' not to have a default of ${columnDefault}`,
			);
		},
		columnWithIdentity: async (
			columnName: string,
			qualifiedTableName: string,
		) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.columns")
				.select("is_identity")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("column_name", "=", columnName)
				.execute();
			assert(
				result.length !== 0,
				`Column '${columnName}' not in "${tableName}"."${schemaName}"`,
			);
			assert(
				result[0]?.is_identity === "NO",
				`Expected column '${columnName}' to be an identity column.`,
			);
		},
		constraint: async (constraintName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("information_schema.table_constraints")
				.select("constraint_name")
				.where("table_schema", "=", schemaName)
				.where("table_name", "=", tableName)
				.where("constraint_name", "=", constraintName)
				.execute();
			assert(
				result.length === 0,
				`Constraint "${constraintName}" in "${schemaName}"."${tableName}"`,
			);
		},
		index: async (indexName: string, qualifiedTableName: string) => {
			const [schemaName, tableName] = splitQualifiedName(qualifiedTableName);
			const result = await context.dbClient
				.selectFrom("pg_indexes")
				.select("indexname")
				.where("schemaname", "=", schemaName)
				.where("tablename", "=", tableName)
				.where("indexname", "=", indexName)
				.execute();
			assert(
				result.length === 0,
				`Index "${indexName}" in "${schemaName}"."${tableName}"`,
			);
		},
	};
};
