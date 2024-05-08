import { describe, expect, test } from "vitest";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import {
	foreignKey,
	foreignKeyOptions,
} from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { tableInfo } from "~/introspection/helpers.js";
import { table } from "../src/database/schema/table/table.js";

describe("PgForeignKeyConstraint", () => {
	test("foreign key with defaults", () => {
		const users = table({
			columns: {
				id: integer(),
			},
		});
		const documments = table({
			columns: {
				id: integer(),
				user_id: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["user_id"], users, ["id"])],
			},
		});
		const constraint =
			tableInfo(documments).definition.constraints?.foreignKeys![0];

		const options = foreignKeyOptions(constraint!);
		expect(options.columns).toStrictEqual(["user_id"]);
		expect(options.targetColumns).toStrictEqual(["id"]);
		expect(options.targetTable).toBe(users);
		expect(options.deleteRule).toBe("NO ACTION");
		expect(options.updateRule).toBe("NO ACTION");
	});

	test("foreign key with custom update and delete rules", () => {
		const users = table({
			columns: {
				id: integer(),
			},
		});
		const documments = table({
			columns: {
				id: integer(),
				user_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["user_id"], users, ["id"])
						.deleteRule("restrict")
						.updateRule("cascade"),
				],
			},
		});
		const constraint =
			tableInfo(documments).definition.constraints?.foreignKeys![0];

		const options = foreignKeyOptions(constraint!);
		expect(options.columns).toStrictEqual(["user_id"]);
		expect(options.targetColumns).toStrictEqual(["id"]);
		expect(options.targetTable).toBe(users);
		expect(options.deleteRule).toBe("RESTRICT");
		expect(options.updateRule).toBe("CASCADE");
	});
});
