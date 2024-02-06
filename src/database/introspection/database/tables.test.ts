import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalKysely } from "~tests/setup.js";
import { dbTableInfo } from "./tables.js";

describe("#dbTableInfo", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	it<DbContext>("returns info on all tables", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("table_info1");
		tableNames.push("table_info2");
		tableNames.push("table_info3");
		await kysely.schema.createTable("table_info1").execute();
		await kysely.schema.createTable("table_info2").execute();
		await kysely.schema.createTable("table_info3").execute();
		const results = await dbTableInfo(kysely, "public");
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}
		const allResults = results.result;
		const hasTableInfo1 = allResults.some(
			(element) =>
				element.name === "table_info1" && element.schemaName === "public",
		);
		expect(hasTableInfo1).toBe(true);
		const hasTableInfo2 = allResults.some(
			(element) =>
				element.name === "table_info2" && element.schemaName === "public",
		);
		expect(hasTableInfo2).toBe(true);
		const hasTableInfo3 = allResults.some(
			(element) =>
				element.name === "table_info3" && element.schemaName === "public",
		);
		expect(hasTableInfo3).toBe(true);
	});
});
