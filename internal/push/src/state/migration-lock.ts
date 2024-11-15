import { sql } from "kysely";
import type { AnyKysely } from "~push/changeset/introspection.js";

export class MigrationLock {
	#LOCK_ID = sql.lit(BigInt("3853314791062309107"));

	constructor(private db: AnyKysely) {}

	async acquire() {
		await sql`select pg_advisory_lock(${this.#LOCK_ID})`.execute(this.db);
	}

	async release() {
		await sql`select pg_advisory_unlock(${this.#LOCK_ID})`.execute(this.db);
	}
}
