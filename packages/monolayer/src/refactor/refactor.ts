import type { Kysely, RawBuilder } from "kysely";

export abstract class Refactor {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	abstract prepare(db: Kysely<any>): RawBuilder<unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	abstract down(db: Kysely<any>): RawBuilder<unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	abstract perform(db: Kysely<any>): RawBuilder<unknown>;
}
