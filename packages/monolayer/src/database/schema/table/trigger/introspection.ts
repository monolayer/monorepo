import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	PgTrigger,
	type AnyTrigger,
} from "~/database/schema/table/trigger/trigger.js";
import { tableInfo } from "~/introspection/helpers.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../introspection/types.js";

export async function dbTriggerInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return {};
	}

	const results = await kysely
		.selectFrom("pg_trigger")
		.innerJoin("pg_class", "pg_class.oid", "pg_trigger.tgrelid")
		.innerJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
		.select([
			"pg_trigger.tgname as trigger_name",
			"pg_class.relname as table_name",
			sql<string>`pg_get_triggerdef(pg_trigger.oid)`.as("definition"),
			sql<string>`obj_description(pg_trigger.oid, 'pg_trigger')`.as("comment"),
		])
		.where("pg_namespace.nspname", "=", databaseSchema)
		.where("pg_class.relname", "in", tableNames)
		.where("pg_trigger.tgname", "~", "_trg$")
		.execute();

	const triggerInfo = results.reduce<TriggerInfo>((acc, curr) => {
		const constraintHash = curr.trigger_name?.match(/^\w+_(\w+)_trg$/)![1];

		acc[curr.table_name] = {
			...acc[curr.table_name],
			...{
				[curr.trigger_name]: `${constraintHash}:${curr.definition}`,
			},
		};
		return acc;
	}, {});

	return triggerInfo;
}

export function triggerInfo(
	trigger: AnyTrigger,
	triggerName: string,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
	schemaName: string,
) {
	const compileArgs = PgTrigger.info(trigger);

	const transformedColumnNames = compileArgs.columns?.map((column) =>
		toSnakeCase(column, camelCase),
	);
	const events = compileArgs.events?.map((event) => {
		if (event === "update of" && transformedColumnNames !== undefined) {
			return `UPDATE OF ${transformedColumnNames.join(", ")}`;
		}
		return event.toUpperCase();
	});

	const execute =
		compileArgs.functionArgs !== undefined
			? `${compileArgs.functionName}(${compileArgs.functionArgs
					.map((arg) => {
						if (typeof arg === "string") {
							return `'${arg}'`;
						}
						return `${toSnakeCase(arg.compile(kysely).sql, camelCase)}`;
					})
					.join(", ")})`
			: `${compileArgs.functionName}()`;

	return [
		`CREATE OR REPLACE TRIGGER ${triggerName}`,
		`${compileArgs.firingTime?.toUpperCase()} ${events?.join(
			" OR ",
		)} ON "${schemaName}"."${tableName}"`,
		`${
			compileArgs.referencingNewTableAs !== undefined &&
			compileArgs.referencingOldTableAs !== undefined
				? `REFERENCING NEW TABLE AS ${compileArgs.referencingNewTableAs} OLD TABLE AS ${compileArgs.referencingOldTableAs}`
				: compileArgs.referencingNewTableAs !== undefined
					? `REFERENCING NEW TABLE AS ${compileArgs.referencingNewTableAs}`
					: compileArgs.referencingOldTableAs !== undefined
						? `REFERENCING OLD TABLE AS ${compileArgs.referencingOldTableAs}`
						: ""
		}`,
		`FOR EACH ${compileArgs.forEach?.toUpperCase()}`,
		`${
			compileArgs.condition !== undefined
				? `WHEN ${compileArgs.condition.compile(kysely).sql}`
				: ""
		}`,
		`EXECUTE FUNCTION ${execute}`,
	]
		.filter((part) => part !== "")
		.join("\n");
}

export function localTriggersInfo(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const dbInfo = Schema.info(schema);
	const tables = dbInfo.tables;
	return Object.entries(tables || {}).reduce<TriggerInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const triggers = tableInfo(tableDefinition).definition.triggers;
			if (triggers === undefined) {
				return acc;
			}
			for (const trigger of triggers) {
				if (PgTrigger.info(trigger).isExternal) {
					return acc;
				}
				const sampleTrigger = triggerInfo(
					trigger,
					"sample",
					transformedTableName,
					kysely,
					camelCase,
					dbInfo.name || "public",
				);

				const triggerKey = hashValue(sampleTrigger);
				const triggerName =
					`${transformedTableName}_${triggerKey}_trg`.toLowerCase();

				const compiledTrigger = triggerInfo(
					trigger,
					triggerName,
					transformedTableName,
					kysely,
					camelCase,
					dbInfo.name || "public",
				);

				acc[transformedTableName] = {
					...acc[transformedTableName],
					[triggerName]: `${triggerKey}:${compiledTrigger}`,
				};
			}
			return acc;
		},
		{},
	);
}

export type TriggerInfo = Record<string, Record<string, string>>;
