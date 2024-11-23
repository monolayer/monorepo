import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Database } from "~workloads/workloads/stateful/database.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("Database is a StatefulWorkloadWithClient", () => {
	expect(Database.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

class TestDatabase<C> extends Database<C> {
	connStringPrefix() {
		return "test";
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

test("connection string components without server id", () => {
	const db = new TestDatabase("myDb", {
		client: () => true,
	});
	expect(db.connStringComponents).toStrictEqual(["test", "myDb", "database"]);
});

test("connection string components with server id", () => {
	const db = new TestDatabase("myDb", {
		client: () => true,
		serverId: "main",
	});
	expect(db.connStringComponents).toStrictEqual([
		"test",
		"main",
		"myDb",
		"database",
	]);
});
