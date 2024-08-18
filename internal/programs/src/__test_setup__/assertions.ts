import { expect } from "vitest";
import { pgAdminPool } from "~programs/__test_setup__/pool.js";

export async function assertCurrentConnectionDatabaseName(expected?: string) {
	const assertion = expect(
		(await pgAdminPool().query("SELECT datname FROM pg_database;")).rows.find(
			(row) => row.datname === expected,
		),
	);
	if (expected === undefined) {
		assertion.toBeUndefined();
		return;
	} else {
		assertion.toEqual({ datname: expected });
	}
}

export function expectLogMessage({
	messages,
	expected,
	count,
}: {
	messages: string[];
	expected: string;
	count: number;
}) {
	return expect(
		messages.filter((message) => message.includes(expected)).length,
		messages.join("\n"),
	).toBe(count);
}
