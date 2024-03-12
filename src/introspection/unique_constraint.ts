import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/migration_op/helpers.js";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import type { UniqueInfo } from "~/migrations/migration_schema.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg_database.js";
import { tableInfo } from "~/schema/pg_table.js";
import { uniqueConstraintOptions, type PgUnique } from "~/schema/pg_unique.js";
import type { InformationSchemaDB } from "./types.js";

export type UniqueConstraintInfo = {
	constraintType: "UNIQUE";
	table: string | null;
	columns: string[];
	nullsDistinct: boolean;
};

export async function dbUniqueConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<UniqueInfo> | OperationAnyError> {
	try {
		if (tableNames.length === 0) {
			return {
				status: ActionStatus.Success,
				result: {},
			};
		}
		const results = await kysely
			.selectFrom("pg_constraint")
			.fullJoin("pg_namespace", (join) =>
				join.onRef("pg_namespace.oid", "=", "pg_constraint.connamespace"),
			)
			.fullJoin("pg_class", (join) =>
				join.onRef("pg_class.oid", "=", "pg_constraint.conrelid"),
			)
			.fullJoin("pg_attribute", (join) =>
				join
					.onRef("pg_attribute.attrelid", "=", "pg_class.oid")
					.on("pg_attribute.attnum", "=", sql`ANY(pg_constraint.conkey)`),
			)
			.fullJoin("information_schema.table_constraints", (join) =>
				join.onRef(
					"information_schema.table_constraints.constraint_name",
					"=",
					"pg_constraint.conname",
				),
			)
			.select([
				sql<"UNIQUE">`'UNIQUE'`.as("constraintType"),
				"pg_class.relname as table",
				sql<string[]>`json_agg(pg_attribute.attname)`.as("columns"),
			])
			.select((eb) => [
				eb
					.case()
					.when(
						sql`information_schema.table_constraints.nulls_distinct = 'YES'`,
					)
					.then(true)
					.else(false)
					.end()
					.as("nullsDistinct"),
			])
			.where("pg_constraint.contype", "=", "u")
			.where("pg_constraint.conname", "~", "kinetic_key$")
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("pg_class.relname", "in", tableNames)
			.groupBy(["table", "information_schema.table_constraints.nulls_distinct"])
			.execute();
		const transformedResults = results.reduce<UniqueInfo>((acc, result) => {
			const keyName = `${result.table}_${result.columns
				.sort()
				.join("_")}_kinetic_key`;
			const constraintInfo = {
				[keyName]: uniqueConstraintInfoToQuery(result),
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

export function localUniqueConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const tables = PgDatabase.info(schema).tables;
	return Object.entries(tables || {}).reduce<UniqueInfo>(
		(acc, [tableName, tableDefinition]) => {
			const uniqueConstraints =
				tableInfo(tableDefinition).schema.constraints?.unique;
			if (uniqueConstraints !== undefined) {
				for (const uniqueConstraint of uniqueConstraints) {
					const unique = uniqueToInfo(
						uniqueConstraint,
						tableName,
						kysely,
						camelCase,
					);
					acc[tableName] = {
						...acc[tableName],
						...unique,
					};
				}
			}
			return acc;
		},
		{},
	);
}

export function uniqueToInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	unique: PgUnique<any>,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
) {
	const args = uniqueConstraintOptions(unique);
	const newTableName = toSnakeCase(tableName, camelCase);
	const columns = args.columns
		.sort()
		.map((column) => toSnakeCase(column, camelCase));
	const keyName = `${newTableName}_${columns.join("_")}_kinetic_key`;

	const kyselyBuilder = kysely.schema
		.alterTable(newTableName)
		.addUniqueConstraint(keyName, columns, (uc) => {
			if (args.nullsDistinct === false) {
				return uc.nullsNotDistinct();
			}
			return uc;
		});

	let compiledQuery = kyselyBuilder.compile().sql;

	compiledQuery = compiledQuery.replace(
		/alter table "\w+" add constraint /,
		"",
	);
	if (args.nullsDistinct) {
		compiledQuery = compiledQuery.replace("unique", "UNIQUE NULLS DISTINCT");
	} else {
		compiledQuery = compiledQuery.replace(
			"unique nulls not distinct",
			"UNIQUE NULLS NOT DISTINCT",
		);
	}

	return {
		[keyName]: compiledQuery,
	};
}

export function uniqueConstraintInfoToQuery(info: UniqueConstraintInfo) {
	return [
		`"${info.table}_${info.columns.sort().join("_")}_kinetic_key"`,
		"UNIQUE",
		info.nullsDistinct ? "NULLS DISTINCT" : "NULLS NOT DISTINCT",
		`(${info.columns
			.sort()
			.map((col) => `"${col}"`)
			.join(", ")})`,
	].join(" ");
}
