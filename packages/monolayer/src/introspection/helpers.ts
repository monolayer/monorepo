import {
	CamelCasePlugin,
	Kysely,
	PostgresDialect,
	type Expression,
	type RawBuilder,
} from "kysely";
import pg from "pg";
import {
	TableIntrospection,
	introspectTable,
} from "~/database/schema/introspect-table.js";
import type {
	AnyPgTable,
	PgTable,
	TableDefinition,
} from "~/database/schema/table/table.js";

export function compileDefaultExpression(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expression: Expression<any>,
	camelCase = false,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
		plugins: camelCase ? [new CamelCasePlugin()] : [],
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const compiled = (expression as RawBuilder<any>).compile(kysely);

	return substituteSQLParameters({
		sql: compiled.sql,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		parameters: compiled.parameters as any[],
	});
}

function substituteSQLParameters(queryObject: {
	sql: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parameters: any[];
}) {
	let { sql } = queryObject;
	const { parameters } = queryObject;
	// Replace each placeholder with the corresponding parameter from the array
	parameters.forEach((param, idx) => {
		// Create a regular expression for each placeholder (e.g., $1, $2)
		// Note: The backslash is escaped in the string, and '$' is escaped in the regex
		const regex = new RegExp(`\\$${idx + 1}`, "g");
		const value = typeof param === "object" ? JSON.stringify(param) : param;
		sql = sql.replace(regex, value);
	});

	return sql;
}

type InferTableDefinition<T extends AnyPgTable> =
	T extends PgTable<infer C, infer PK> ? TableDefinition<C, PK> : never;

export function tableInfo<T extends AnyPgTable>(table: T) {
	const info = Object.fromEntries(Object.entries(table)) as unknown as {
		definition: InferTableDefinition<T>;
		introspect(dbTables?: Record<string, AnyPgTable>): TableIntrospection;
	};
	info.introspect = (dbTables?: Record<string, AnyPgTable>) => {
		return introspectTable(table, dbTables);
	};
	return info;
}
