import { describe, expect, test } from "vitest";
import { type PgSerial } from "~/schema/column/data-types/serial.js";
import {
	foreignKey,
	foreignKeyOptions,
} from "../../src/schema/foreign-key/foreign-key.js";
import { type PgTable } from "../../src/schema/table/table.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableWithIdSerial = PgTable<{ id: PgSerial }, any>;

describe("PgForeignKeyConstraint", () => {
	test("sets columns", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"]);
		const options = foreignKeyOptions(constraint);
		expect(options.columns).toStrictEqual(["user_id"]);
	});

	test("sets targetTable", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"]);
		const options = foreignKeyOptions(constraint);
		expect(options.targetTable).toBe("users");
	});

	test("sets targetColumns", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"]);
		const options = foreignKeyOptions(constraint);
		expect(options.targetColumns).toStrictEqual(["id"]);
	});

	test("has no action as default for deleteRule", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"]);
		const options = foreignKeyOptions(constraint);
		expect(options.deleteRule).toBe("NO ACTION");
	});

	test("has no action as default for updateRule", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"]);
		const options = foreignKeyOptions(constraint);
		expect(options.updateRule).toBe("NO ACTION");
	});

	test("options can be set", () => {
		const users = "users" as unknown as TableWithIdSerial;
		const constraint = foreignKey(["user_id"], users, ["id"])
			.updateRule("cascade")
			.deleteRule("cascade");
		const options = foreignKeyOptions(constraint);

		expect(options.deleteRule).toStrictEqual("CASCADE");
		expect(options.updateRule).toStrictEqual("CASCADE");
	});
});
