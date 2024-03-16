import { createHash } from "crypto";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/migration_op/helpers.js";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg_database.js";
import { tableInfo } from "~/schema/pg_table.js";
import { PgTrigger } from "~/schema/pg_trigger.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbTriggerInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<TriggerInfo> | OperationAnyError> {
	if (tableNames.length === 0) {
		return {
			status: ActionStatus.Success,
			result: {},
		};
	}

	try {
		const results = await kysely
			.selectFrom("pg_trigger")
			.innerJoin("pg_class", "pg_class.oid", "pg_trigger.tgrelid")
			.innerJoin("pg_namespace", "pg_namespace.oid", "pg_class.relnamespace")
			.select([
				"pg_trigger.tgname as trigger_name",
				"pg_class.relname as table_name",
				sql<string>`pg_get_triggerdef(pg_trigger.oid)`.as("definition"),
				sql<string>`obj_description(pg_trigger.oid, 'pg_trigger')`.as(
					"comment",
				),
			])
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("pg_class.relname", "in", tableNames)
			.where("pg_trigger.tgname", "~", "_trg$")
			.execute();

		const triggerInfo = results.reduce<TriggerInfo>((acc, curr) => {
			acc[curr.table_name] = {
				...acc[curr.table_name],
				...{
					[curr.trigger_name]: `${curr.comment}:${curr.definition}`,
				},
			};
			return acc;
		}, {});

		return {
			status: ActionStatus.Success,
			result: triggerInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error,
		};
	}
}

export function triggerInfo(
	trigger: PgTrigger,
	triggerName: string,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
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
						return `'${toSnakeCase(arg.column, camelCase)}'`;
					})
					.join(", ")})`
			: `${compileArgs.functionName}`;

	return [
		`CREATE OR REPLACE TRIGGER ${triggerName}`,
		`${compileArgs.firingTime?.toUpperCase()} ${events?.join(
			" OR ",
		)} ON ${tableName}`,
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
	return Object.entries(tables || {}).reduce<TriggerInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const triggers = tableInfo(tableDefinition).schema.triggers;
			if (triggers === undefined) {
				return acc;
			}
			for (const trigger of Object.entries(triggers || {})) {
				const triggerName = `${trigger[0]}_trg`.toLowerCase();
				const hash = createHash("sha256");
				const compiledTrigger = triggerInfo(
					trigger[1],
					triggerName,
					transformedTableName,
					kysely,
					camelCase,
				);
				hash.update(compiledTrigger);

				acc[transformedTableName] = {
					...acc[transformedTableName],
					[triggerName]: `${hash.digest("hex")}:${compiledTrigger}`,
				};
			}
			return acc;
		},
		{},
	);
}

export type TriggerInfo = Record<string, Record<string, string>>;
