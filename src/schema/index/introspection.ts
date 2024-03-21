import { createHash } from "crypto";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/helpers.js";
import {
	ActionStatus,
	OperationAnyError,
	OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import { tableInfo } from "~/introspection/helpers.js";
import {
	indexOptions,
	isExternalIndex,
	type PgIndex,
} from "~/schema/index/index.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg-database.js";
import type { InformationSchemaDB } from "../../introspection/types.js";

export async function dbIndexInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<IndexInfo> | OperationAnyError> {
	if (tableNames.length === 0) {
		return {
			status: ActionStatus.Success,
			result: {},
		};
	}

	try {
		const results = await kysely
			.selectFrom("pg_class")
			.innerJoin("pg_index", "pg_class.oid", "pg_index.indrelid")
			.innerJoin(
				"pg_class as pg_class_2",
				"pg_index.indexrelid",
				"pg_class_2.oid",
			)
			.leftJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
			.select([
				"pg_class.relname as table",
				"pg_class_2.relname as name",
				sql<string>`pg_get_indexdef(pg_index.indexrelid)`.as("definition"),
				sql<string>`obj_description(pg_index.indexrelid, 'pg_class')`.as(
					"comment",
				),
			])
			.distinct()
			.where("pg_class_2.relkind", "in", ["i", "I"])
			.where("pg_index.indisprimary", "=", false)
			.where("pg_class_2.relname", "~", "idx$")
			.where("pg_class.relname", "in", tableNames)
			.where("pg_namespace.nspname", "=", databaseSchema)
			.orderBy("pg_class_2.relname")
			.execute();

		const indexInfo = results.reduce<IndexInfo>((acc, curr) => {
			acc[curr.table] = {
				...acc[curr.table],
				...{
					[curr.name]: `${curr.comment}:${curr.definition}`,
				},
			};
			return acc;
		}, {});
		return {
			status: ActionStatus.Success,
			result: indexInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

export function localIndexInfoByTable(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const tables = PgDatabase.info(schema).tables;
	return Object.entries(tables || {}).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const indexes =
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				tableInfo(tableDefinition).schema.indexes || ([] as PgIndex<any>[]);
			for (const index of indexes) {
				if (isExternalIndex(index)) {
					return acc;
				}
				const indexInfo = indexToInfo(
					index,
					transformedTableName,
					kysely,
					camelCase,
				);
				acc[transformedTableName] = {
					...acc[transformedTableName],
					...indexInfo,
				};
			}
			return acc;
		},
		{},
	);
}

export function indexToInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	index: PgIndex<any>,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
) {
	const indexCompileArgs = indexOptions(index);
	const transformedTableName = toSnakeCase(tableName, camelCase);
	const transformedColumnNames = indexCompileArgs.columns.map((column) =>
		toSnakeCase(column, camelCase),
	);
	const indexName = `${transformedTableName}_${transformedColumnNames.join(
		"_",
	)}_kntc_idx`;
	let kyselyBuilder = kysely.schema
		.createIndex(indexName)
		.on(transformedTableName)
		.columns(transformedColumnNames);

	if (indexCompileArgs.ifNotExists) {
		kyselyBuilder = kyselyBuilder.ifNotExists();
	}
	if (indexCompileArgs.unique) {
		kyselyBuilder = kyselyBuilder.unique();
	}
	if (indexCompileArgs.nullsNotDistinct) {
		kyselyBuilder = kyselyBuilder.nullsNotDistinct();
	}
	if (indexCompileArgs.expression !== undefined) {
		kyselyBuilder = kyselyBuilder.expression(indexCompileArgs.expression);
	}
	if (indexCompileArgs.using !== undefined) {
		kyselyBuilder = kyselyBuilder.using(indexCompileArgs.using);
	}
	if (indexCompileArgs.where !== undefined) {
		if (indexCompileArgs.where.length === 1) {
			kyselyBuilder = kyselyBuilder.where(indexCompileArgs.where[0]);
		}
		if (indexCompileArgs.where.length === 3) {
			kyselyBuilder = kyselyBuilder.where(
				indexCompileArgs.where[0],
				indexCompileArgs.where[1],
				indexCompileArgs.where[2],
			);
		}
	}
	const compiledQuery = kyselyBuilder.compile().sql;

	const hash = createHash("sha256");
	hash.update(compiledQuery);
	return {
		[indexName]: `${hash.digest("hex")}:${compiledQuery}`,
	};
}

export type IndexInfo = Record<string, Record<string, string>>;
