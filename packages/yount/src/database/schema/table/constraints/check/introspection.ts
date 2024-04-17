import { Kysely, sql } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	assertCheckWithInfo,
	type PgCheck,
} from "~/database/schema/table/constraints/check/check.js";
import {
	compileDefaultExpression,
	tableInfo,
} from "~/introspection/helpers.js";
import type { CheckInfo } from "~/migrations/migration-schema.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../../introspection/types.js";

export async function dbCheckConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return {};
	}
	const results = await kysely
		.selectFrom("pg_constraint")
		.fullJoin("pg_class", (join) =>
			join.onRef("pg_class.oid", "=", "pg_constraint.conrelid"),
		)
		.fullJoin("pg_namespace", (join) =>
			join.onRef("pg_class.relnamespace", "=", "pg_namespace.oid"),
		)
		.select([
			"pg_constraint.conname as constraint_name",
			sql<string>`pg_class.relname`.as("table"),
			sql<string>`pg_get_constraintdef(pg_constraint.oid)`.as("definition"),
		])
		.where("pg_constraint.contype", "=", "c")
		.where("pg_namespace.nspname", "=", databaseSchema)
		.where("pg_constraint.conname", "~", "yount_chk$")
		.where("pg_class.relname", "in", tableNames)
		.execute();
	const transformedResults = results.reduce<CheckInfo>((acc, result) => {
		const constraintHash = result.constraint_name?.match(
			/^\w+_(\w+)_yount_chk$/,
		)![1];
		const constraintInfo = {
			[`${constraintHash}`]: `${result.definition}`,
		};
		const table = result.table;
		acc[table] = {
			...acc[table],
			...constraintInfo,
		};
		return acc;
	}, {});
	return transformedResults;
}

export function localCheckConstraintInfo(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce<CheckInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const checkConstraints = tableInfo(tableDefinition).schema.constraints
				?.checks as PgCheck[];
			if (checkConstraints !== undefined) {
				for (const checkConstraint of checkConstraints) {
					const check = checkConstraint;
					assertCheckWithInfo(check);
					if (check.isExternal) {
						return acc;
					}
					const checkExpression = compileDefaultExpression(
						check.expression,
						camelCase.enabled,
					);
					const key = hashValue(checkExpression);
					const checkObject = {
						[`${key}`]: `${checkExpression}`,
					};
					acc[transformedTableName] = {
						...acc[transformedTableName],
						...checkObject,
					};
				}
			}
			return acc;
		},
		{},
	);
}
