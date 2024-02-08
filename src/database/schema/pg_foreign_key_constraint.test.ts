import { describe, expect, test } from "vitest";
import { type PgSerial } from "./pg_column.js";
import {
	PgForeignKeyConstraint,
	pgForeignKeyConstraint,
} from "./pg_foreign_key.js";
import { type PgTable } from "./pg_table.js";

describe("PgForeignKeyConstraint", () => {
	test("it can be instantiated with pgForeignKeyConstraint", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint).toBeInstanceOf(PgForeignKeyConstraint);
	});

	test("sets columns", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint.columns).toStrictEqual(["user_id"]);
	});

	test("sets targetTable", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint.targetTable).toBe("users");
	});

	test("sets targetColumns", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint.targetColumns).toStrictEqual(["id"]);
	});

	test("has no action as default for deleteRule", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint.options.deleteRule).toBe("NO ACTION");
	});

	test("has no action as default for updateRule", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"]);
		expect(constraint.options.updateRule).toBe("NO ACTION");
	});

	test("options can be set", () => {
		const users = "users" as unknown as PgTable<"users", { id: PgSerial }>;
		const constraint = pgForeignKeyConstraint(["user_id"], users, ["id"], {
			deleteRule: "cascade",
			updateRule: "cascade",
		});
		expect(constraint.options).toStrictEqual({
			deleteRule: "CASCADE",
			updateRule: "CASCADE",
		});
	});
});
