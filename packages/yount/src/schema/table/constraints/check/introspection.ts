import { Kysely, sql } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import {
	compileDefaultExpression,
	tableInfo,
} from "~/introspection/helpers.js";
import type { CheckInfo } from "~/migrations/migration-schema.js";
import { Schema, type AnySchema } from "~/schema/schema.js";
import {
	assertCheckWithInfo,
	type PgCheck,
} from "~/schema/table/constraints/check/check.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../introspection/types.js";

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
			"pg_class.relname as table",
			sql<string>`pg_get_constraintdef(pg_constraint.oid)`.as("definition"),
			sql<string>`obj_description(pg_constraint.oid, 'pg_constraint')`.as(
				"comment",
			),
		])
		.where("pg_constraint.contype", "=", "c")
		.where("pg_namespace.nspname", "=", databaseSchema)
		.where("pg_constraint.conname", "~", "yount_chk$")
		.where("pg_class.relname", "in", tableNames)
		.execute();
	const transformedResults = results.reduce<CheckInfo>((acc, result) => {
		const constraintInfo = {
			[`${result.constraint_name}`]: `${result.comment}:${result.definition}`,
		};
		const table = result.table;
		if (table !== null) {
			acc[table] = {
				...acc[table],
				...constraintInfo,
			};
		}
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
					const name = `${key}_yount_chk`;
					const checkObject = {
						[`${name}`]: `${key}:${checkExpression}`,
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
