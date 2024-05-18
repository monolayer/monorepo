/* eslint-disable max-lines */
import { sql } from "kysely";
import type { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { compileTrigger } from "~tests/__setup__/helpers/indexes.js";
import {
	trigger,
	type PgTrigger,
} from "../src/database/schema/table/trigger/trigger.js";

describe("pg_trigger", () => {
	test("trigger before", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["update", "delete"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger after", async () => {
		const trg = trigger({
			fireWhen: "after",
			events: ["update", "delete"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
AFTER UPDATE OR DELETE ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger instead of", async () => {
		const trg = trigger({
			fireWhen: "instead of",
			events: ["update", "delete"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OR DELETE ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on single event", async () => {
		const trg = trigger({
			fireWhen: "instead of",
			events: ["update"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on multiple events", async () => {
		const trg = trigger({
			fireWhen: "instead of",
			events: ["update", "insert"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OR INSERT ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on update of", async () => {
		const trg = trigger({
			fireWhen: "instead of",
			events: ["update of"],
			columns: ["balance", "name"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OF balance, name ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with default fire when", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["update", "delete"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON "public"."accounts"
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with for each row", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["update", "delete"],
			forEach: "row",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON "public"."accounts"
FOR EACH ROW
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingNewTableAs: "new_table",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing new table", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingNewTableAs: "new_table",
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING NEW TABLE AS new_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing old table", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update()`;

		const compiled = await compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with function arguments", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
				args: ["hello"],
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update('hello')`;

		const compiled = await compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with function arguments as columns without camelCase", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
				args: [sql.ref("updatedAt")],
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update("updatedAt")`;

		const compiled = await compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with function arguments as columns with camelCase", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["delete"],
			forEach: "statement",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
				args: [sql.ref("updatedAt")],
			},
		});

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON "public"."accounts"
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update("updated_at")`;

		const compiled = await compileTrigger(
			trg,
			"my_trigger_2",
			"accounts",
			true,
		);
		expect(compiled).toBe(expected);
	});

	test("trigger with columns type", async () => {
		const trg = trigger({
			fireWhen: "before",
			columns: ["balance", "name"],
			events: ["delete"],
			forEach: "statement",
			referencingOldTableAs: "old_table",
			function: {
				name: "check_account_update",
				args: [sql.ref("updatedAt")],
			},
		});
		type Expected = PgTrigger<"balance" | "name">;
		const triggerExpect: Expect<Equal<typeof trg, Expected>> = true;
		expectTypeOf(triggerExpect).toMatchTypeOf<boolean>();
	});

	test("trigger without columns type", async () => {
		const trg = trigger({
			fireWhen: "before",
			events: ["update", "delete"],
			forEach: "statement",
			condition: sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`,
			function: {
				name: "check_account_update",
			},
		});
		type Expected = PgTrigger<never>;
		const triggerExpect: Expect<Equal<typeof trg, Expected>> = true;
		expectTypeOf(triggerExpect).toMatchTypeOf<boolean>();
	});
});
