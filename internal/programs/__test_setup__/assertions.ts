import { expect } from "vitest";
import { pgAdminPool } from "~test-setup/pool.js";

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
