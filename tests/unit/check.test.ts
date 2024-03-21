import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { PgCheck, assertCheckWithInfo } from "~/schema/check.js";

describe("PgCheck", () => {
	test("expression", () => {
		const expression = sql`${sql.ref("numberOfLegs")} < 5`;
		const check = new PgCheck(expression);
		assertCheckWithInfo(check);
		expect(check.expression).toBe(expression);
	});

	test("is external is false by default", () => {
		const expression = sql`${sql.ref("numberOfLegs")} < 5`;
		const check = new PgCheck(expression);
		assertCheckWithInfo(check);
		expect(check.isExternal).toBe(false);
	});

	test("#external", () => {
		const expression = sql`${sql.ref("numberOfLegs")} < 5`;
		const check = new PgCheck(expression).external();
		assertCheckWithInfo(check);
		expect(check.isExternal).toBe(true);
	});
});
