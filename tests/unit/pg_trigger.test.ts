import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { compileTrigger } from "~tests/helpers/indexes.js";
import { pgTrigger } from "../../src/database/schema/pg_trigger.js";

describe("pg_trigger", () => {
	test("trigger before", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["update", "delete"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger after", () => {
		const trg = pgTrigger()
			.fireWhen("after")
			.events(["update", "delete"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
AFTER UPDATE OR DELETE ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger instead of", () => {
		const trg = pgTrigger()
			.fireWhen("instead of")
			.events(["update", "delete"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OR DELETE ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on single event", () => {
		const trg = pgTrigger()
			.fireWhen("instead of")
			.events(["update"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on multiple events", () => {
		const trg = pgTrigger()
			.fireWhen("instead of")
			.events(["update", "insert"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OR INSERT ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger on update of", () => {
		const trg = pgTrigger()
			.fireWhen("instead of")
			.events(["update of"])
			.columns(["balance", "name"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
INSTEAD OF UPDATE OF balance, name ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with default fire when", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["update", "delete"])
			.forEach("statement")
			.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON accounts
FOR EACH STATEMENT
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with for each row", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["update", "delete"])
			.forEach("row")
			.condition(sql`OLD.balance IS DISTINCT FROM NEW.balance`)
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger
BEFORE UPDATE OR DELETE ON accounts
FOR EACH ROW
WHEN OLD.balance IS DISTINCT FROM NEW.balance
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["delete"])
			.forEach("statement")
			.referencingNewTableAs("new_table")
			.referencingOldTableAs("old_table")
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON accounts
REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing new table", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["delete"])
			.forEach("statement")
			.referencingNewTableAs("new_table")
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON accounts
REFERENCING NEW TABLE AS new_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with referencing old table", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["delete"])
			.forEach("statement")
			.referencingOldTableAs("old_table")
			.function("check_account_update");

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON accounts
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update`;

		const compiled = compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});

	test("trigger with function arguments", () => {
		const trg = pgTrigger()
			.fireWhen("before")
			.events(["delete"])
			.forEach("statement")
			.referencingOldTableAs("old_table")
			.function("check_account_update", ["hello"]);

		const expected = `CREATE OR REPLACE TRIGGER my_trigger_2
BEFORE DELETE ON accounts
REFERENCING OLD TABLE AS old_table
FOR EACH STATEMENT
EXECUTE FUNCTION check_account_update(hello)`;

		const compiled = compileTrigger(trg, "my_trigger_2", "accounts");
		expect(compiled).toBe(expected);
	});
});
