import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("Database is a StatefulWorkloadWithClient", () => {
	expect(Database.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

class TestDatabase<C> extends Database<C> {
	connStringPrefix() {
		return "";
	}
}

test("databaseId", () => {
	const db = new TestDatabase("myDb", {
		serverId: "test-id",
		client: () => true,
	});
	expect(db.id).toStrictEqual("test-id");
});

test("databaseId defaults to databaseName", () => {
	const db = new TestDatabase("myDb", {
		client: () => true,
	});
	expect(db.id).toStrictEqual(db.databaseName);
});
