import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("Database is a StatefulWorkloadWithClient", () => {
	expect(Database.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

class TestDatabase extends Database {
	connStringPrefix() {
		return "test";
	}
}

test("databaseId defaults to databaseName", () => {
	const db = new TestDatabase("myDb");
	expect(db.id).toStrictEqual(db.databaseName);
});

test("connection string components", () => {
	const db = new TestDatabase("myDb");
	expect(db.connStringComponents).toStrictEqual(["test", "myDb", "database"]);
});
