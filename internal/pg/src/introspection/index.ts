import { hashValue } from "@monorepo/utils/hash-value.js";
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import {
	changedColumnNames,
	currentColumName,
	previousColumnName,
} from "~pg/introspection/column-name.js";
import type { BuilderContext } from "~pg/introspection/introspection/foreign-key-builder.js";
import type { InformationSchemaDB } from "~pg/introspection/introspection/types.js";
import type { ColumnsToRename } from "~pg/introspection/schema.js";
import { tableInfo } from "~pg/introspection/table.js";
import {
	indexOptions,
	type IndexOptions,
	isExternalIndex,
	type PgIndex,
} from "~pg/schema/index.js";
import { type AnySchema, Schema } from "~pg/schema/schema.js";

export async function dbIndexInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
	builderContext: BuilderContext,
) {
	if (tableNames.length === 0) {
		return {};
	}

	const results = await kysely
		.selectFrom("pg_index as idx")
		.innerJoin("pg_class as cls", "cls.oid", "idx.indexrelid")
		.innerJoin("pg_class as tab", "tab.oid", "idx.indrelid")
		.innerJoin("pg_namespace as ns", (join) =>
			join
				.onRef("ns.oid", "=", "tab.relnamespace")
				.on("ns.nspname", "=", databaseSchema),
		)
		.innerJoin("pg_am as am", "am.oid", "cls.relam")
		.leftJoin("pg_depend as dep", (join) =>
			join
				.onRef("dep.classid", "=", "cls.tableoid")
				.onRef("dep.objid", "=", "cls.oid")
				.on("dep.refobjsubid", "=", 0)
				.on(
					"dep.refclassid",
					"=",
					sql`(SELECT oid FROM pg_catalog.pg_class WHERE relname='pg_constraint' AND dep.deptype='i')`,
				),
		)
		.leftJoin("pg_constraint as con", (join) =>
			join
				.onRef("con.tableoid", "=", "dep.refclassid")
				.onRef("con.oid", "=", "dep.refobjid"),
		)
		.leftJoin("pg_description as des", (join) =>
			join
				.onRef("des.objoid", "=", "cls.oid")
				.on("des.classoid", "=", sql`'pg_class'::regclass`),
		)
		.leftJoin("pg_description as desp", (join) =>
			join
				.onRef("desp.objoid", "=", "con.oid")
				.on("desp.objsubid", "=", 0)
				.on("desp.classoid", "=", sql`'pg_constraint'::regclass`),
		)
		.select([
			sql<number>`DISTINCT ON(cls.relname) cls.oid`.as("oid"),
			"cls.relname as name",
			"tab.relname as table",
			sql<string>`pg_get_indexdef(idx.indexrelid)`.as("definition"),
			sql<string>`obj_description(idx.indexrelid, 'pg_class')`.as("comment"),
		])
		.where(sql`con.conname`, "is", sql.raw("null"))
		.where("cls.relname", "~", builderContext.external ? "" : "monolayer_idx$")
		.where("ns.nspname", "=", databaseSchema)
		.orderBy("cls.relname")
		.execute();
	const indexInfo = results.reduce<IndexInfo>((acc, curr) => {
		const key = builderContext.external
			? curr.name
			: curr.name.match(/^\w+_(\w+)_monolayer_idx$/)![1];
		acc[curr.table] = {
			...acc[curr.table],
			...{
				[`${key}`]: curr.definition,
			},
		};
		return acc;
	}, {});
	return indexInfo;
}

export function localIndexInfoByTable(
	schema: AnySchema,
	camelCase: boolean = false,
	columnsToRename: ColumnsToRename = {},
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const dbInfo = Schema.info(schema);
	const tables = dbInfo.tables;
	return Object.entries(tables || {}).reduce<IndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const indexes =
				tableInfo(tableDefinition).definition.indexes ??
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				([] as PgIndex<any>[]);
			for (const index of indexes) {
				if (isExternalIndex(index)) {
					return acc;
				}
				const indexInfo = indexToInfo(
					index,
					transformedTableName,
					kysely,
					camelCase,
					dbInfo.name || "public",
					columnsToRename,
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
	camelCase: boolean,
	schemaName = "public",
	columnsToRename: ColumnsToRename = {},
) {
	const indexCompileArgs = indexOptions(index);
	const transformedTableName = toSnakeCase(tableName, camelCase);
	const transformedColumnNames = indexCompileArgs.columns.map((column) =>
		toSnakeCase(column, camelCase),
	);

	let idx = buildIndex(
		indexCompileArgs,
		"sample",
		indexCompileArgs.columns.map((column) =>
			previousColumnName(
				tableName,
				schemaName,
				toSnakeCase(column, camelCase),
				columnsToRename,
			),
		),
		kysely,
		camelCase,
		schemaName,
		"sample",
	).compile().sql;

	const currentHash = hashValue(
		buildIndex(
			indexCompileArgs,
			"sample",
			indexCompileArgs.columns.map((column) =>
				currentColumName(
					tableName,
					schemaName,
					toSnakeCase(column, camelCase),
					columnsToRename,
				),
			),
			kysely,
			camelCase,
			schemaName,
			"sample",
		).compile().sql,
	);

	for (const changedColumn of changedColumnNames(
		tableName,
		schemaName,
		columnsToRename,
	)) {
		idx = idx.replace(`"${changedColumn.to}"`, `"${changedColumn.from}"`);
	}

	const previousHash = hashValue(idx);

	const kyselyBuilder = buildIndex(
		indexCompileArgs,
		transformedTableName,
		transformedColumnNames,
		kysely,
		camelCase,
		schemaName,
		`${tableName}_${currentHash}_monolayer_idx`,
	);

	const compiledQuery = kyselyBuilder.compile().sql;

	return {
		[previousHash]: compiledQuery,
	};
}

function buildIndex(
	indexCompileArgs: IndexOptions,
	transformedTableName: string,
	transformedColumnNames: string[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: boolean,
	schemaName = "public",
	indexName?: string,
) {
	if (indexName === undefined) {
		indexName = `${transformedColumnNames.join("_")}_monolayer_idx`;
	}

	let kyselyBuilder = (
		camelCase ? kysely.withPlugin(new CamelCasePlugin()) : kysely
	)
		.withSchema(schemaName)
		.schema.createIndex(indexName)
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
	for (const where of indexCompileArgs.where) {
		if (where.length === 1) {
			kyselyBuilder = kyselyBuilder.where(where[0]);
		}
		if (where.length === 3) {
			kyselyBuilder = kyselyBuilder.where(where[0], where[1], where[2]);
		}
	}
	return kyselyBuilder;
}

export type IndexInfo = Record<string, Record<string, string>>;

export function indexNameFromDefinition(value: string) {
	const match = value.match(/(\w+_monolayer_idx)/);
	if (match) {
		return match[1];
	}
	return "";
}

export function rehashIndex(
	tableName: string,
	indexDefinition: string,
	oldHash: string,
) {
	const hash = hashValue(
		indexDefinition
			.replace(
				`."${indexDefinition.match(/on "\w+"\."(\w+)"/)![1]}"`,
				'."sample"',
			)
			.replace(indexNameFromDefinition(indexDefinition)!, "sample"),
	);
	const name = `${tableName}_${hash}_monolayer_idx`;
	const definition = indexDefinition.replace(
		`${tableName}_${oldHash}_monolayer_idx`,
		name,
	);
	return {
		hash,
		name,
		definition,
	};
}
