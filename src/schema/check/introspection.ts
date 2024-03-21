import { createHash } from "crypto";
import { Kysely, sql } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import type { CheckInfo } from "~/migrations/migration-schema.js";
import { assertCheckWithInfo, type PgCheck } from "~/schema/check/check.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg-database.js";
import { tableInfo } from "~/schema/table/table.js";
import { compileDefaultExpression } from "../../introspection/schemas.js";
import type { InformationSchemaDB } from "../../introspection/types.js";

export async function dbCheckConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<CheckInfo> | OperationAnyError> {
	try {
		if (tableNames.length === 0) {
			return {
				status: ActionStatus.Success,
				result: {},
			};
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
			.where("pg_constraint.conname", "~", "kinetic_chk$")
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
		return {
			status: ActionStatus.Success,
			result: transformedResults,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

export function localCheckConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	const tables = PgDatabase.info(schema).tables;
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
					const hash = createHash("sha256");
					hash.update(checkExpression);
					const key = hash.digest("hex").substring(0, 8);
					const name = `${key}_kinetic_chk`;
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
