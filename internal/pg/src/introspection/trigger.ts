import { hashValue } from "@monorepo/utils/hash-value.js";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import type { BuilderContext } from "~pg/introspection/introspection/foreign-key-builder.js";
import type { InformationSchemaDB } from "~pg/introspection/introspection/types.js";
import { tableInfo } from "~pg/introspection/table.js";
import { type AnySchema, Schema } from "~pg/schema/schema.js";
import { type AnyTrigger, PgTrigger } from "~pg/schema/trigger.js";
import { previousTableName } from "./introspection/table-name.js";
import type { TablesToRename } from "./schema.js";

export async function dbTriggerInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
	builderContext: BuilderContext,
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
		.where("pg_trigger.tgisinternal", "=", false)
		.where(
			"pg_trigger.tgname",
			"~",
			builderContext.external ? "" : "monolayer_trg_",
		)
		.execute();

	const triggerInfo = results.reduce<TriggerInfo>((acc, curr) => {
		if (
			(builderContext.skip[curr.table_name] ?? []).includes(
				curr.trigger_name ?? "",
			)
		) {
			return acc;
		}

		const key = builderContext.external
			? curr.trigger_name
			: curr.trigger_name?.match(/^monolayer_trg_(\w+)$/)![1];

		acc[curr.table_name] = {
			...acc[curr.table_name],
			...{
				[curr.trigger_name]: builderContext.external
					? curr.definition
					: `${key}:${curr.definition}`,
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
	camelCase: boolean,
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
	camelCase: boolean,
	tablesToRename: TablesToRename,
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
			const triggers = (tableInfo(tableDefinition).definition.triggers ??
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				[]) as PgTrigger<any>[];

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
					previousTableName(transformedTableName, tablesToRename, dbInfo.name),
					kysely,
					camelCase,
					dbInfo.name || "public",
				);

				const triggerKey = hashValue(sampleTrigger);
				const triggerName = `monolayer_trg_${triggerKey}`.toLowerCase();

				const compiledTrigger = triggerInfo(
					trigger,
					triggerName,
					transformedTableName,
					kysely,
					camelCase,
					dbInfo.name || "public",
				);

				const newKey = hashValue(
					triggerInfo(
						trigger,
						"sample",
						transformedTableName,
						kysely,
						camelCase,
						dbInfo.name || "public",
					),
				);
				acc[transformedTableName] = {
					...acc[transformedTableName],
					[triggerName]: `${newKey}:${compiledTrigger}`,
				};
			}
			return acc;
		},
		{},
	);
}

export type TriggerInfo = Record<string, Record<string, string>>;
