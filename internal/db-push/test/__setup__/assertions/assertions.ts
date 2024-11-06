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
