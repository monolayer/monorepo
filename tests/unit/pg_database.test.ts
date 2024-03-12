/* eslint-disable max-lines */
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	bigserial,
	boolean,
	integer,
	serial,
	text,
	time,
	timestamp,
	varchar,
} from "~/schema/pg_column.js";
import { PgDatabase, pgDatabase } from "~/schema/pg_database.js";
import { foreignKey } from "~/schema/pg_foreign_key.js";
import { primaryKey } from "~/schema/pg_primary_key.js";
import { table } from "~/schema/pg_table.js";
import { trigger } from "~/schema/pg_trigger.js";
import { unique } from "~/schema/pg_unique.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({ tables: {} });
		// eslint-disable-next-line @typescript-eslint/ban-types
		const expect: Expect<Equal<typeof database, PgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = table({
			columns: {
				name: varchar(),
			},
		});
		const teams = table({
			columns: {
				name: varchar(),
			},
		});
		const database = pgDatabase({
			tables: { users, teams },
		});
		const tables = PgDatabase.info(database).tables;
		expect(tables.users).toBe(users);
		expect(tables.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof database,
				PgDatabase<{ users: typeof users; teams: typeof teams }>
			>
		> = true;
		expectTypeOf(expectation).toMatchTypeOf<boolean>();
	});
});

test("with extensions", () => {
	const database = pgDatabase({
		extensions: ["pgcrypto", "btree_gist"],
		tables: {},
	});

	expect(PgDatabase.info(database).extensions).toStrictEqual([
		"pgcrypto",
		"btree_gist",
	]);
});

test("types for Kysely", () => {
	const users = table({
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: text().notNull(),
			address: text(),
		},
	});
	const books = table({
		columns: {
			id: serial(),
			title: varchar().notNull(),
			borrowed: boolean().notNull(),
		},
	});
	const database = pgDatabase({
		tables: {
			users,
			books,
		},
	});

	type ExpectedType = {
		users: typeof users.infer;
		books: typeof books.infer;
	};

	type InferredDBTypes = typeof database.infer;
	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});

describe("introspect", () => {
	test("introspection returns extensions", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const database = pgDatabase({ extensions: ["hstore"], tables: { users } });

		const expected = {
			extensions: ["hstore"],
			tables: {
				users: {
					primaryKey: [],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns empty primary key", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const database = pgDatabase({ tables: { users } });

		const expected = {
			extensions: [],
			tables: {
				users: {
					primaryKey: [],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns primary key", () => {
		const users = table({
			columns: {
				id: serial(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const database = pgDatabase({ tables: { users } });

		const expected = {
			extensions: [],
			tables: {
				users: {
					primaryKey: ["id"],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: true,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns composite primary key", () => {
		const users = table({
			columns: {
				email: text(),
				name: integer().generatedByDefaultAsIdentity(),
			},
			constraints: {
				primaryKey: primaryKey(["email", "name"]),
			},
		});
		const database = pgDatabase({ tables: { users } });

		const expected = {
			extensions: [],
			tables: {
				users: {
					primaryKey: ["email", "name"],
					columns: {
						name: {
							dataType: "integer",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: true,
						},
						email: {
							dataType: "text",
							nullable: false,
							generated: false,
							defaultValue: null,
							primaryKey: true,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns column info", () => {
		const demo = table({
			columns: {
				id: serial(),
				id2: bigserial(),
				name: text(),
				email: text().notNull(),
				count1: integer().generatedByDefaultAsIdentity(),
				count2: integer().generatedAlwaysAsIdentity(),
				description: text().default("TDB"),
				createdAt: timestamp().default(sql`now()`),
				time: time(4),
			},
			constraints: {
				primaryKey: primaryKey(["name", "time"]),
			},
		});

		const database = pgDatabase({ tables: { demo } });

		const expected = {
			extensions: [],
			tables: {
				demo: {
					primaryKey: ["name", "time"],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						id2: {
							dataType: "bigserial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						name: {
							dataType: "text",
							nullable: false,
							generated: false,
							defaultValue: null,
							primaryKey: true,
						},
						email: {
							dataType: "text",
							nullable: false,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
						count1: {
							dataType: "integer",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						count2: {
							dataType: "integer",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						description: {
							dataType: "text",
							nullable: true,
							generated: false,
							defaultValue: "'TDB'::text",
							primaryKey: false,
						},
						createdAt: {
							dataType: "timestamp",
							nullable: true,
							generated: false,
							defaultValue: "sql`now()`",
							primaryKey: false,
						},
						time: {
							dataType: "time(4)",
							defaultValue: null,
							generated: false,
							nullable: false,
							primaryKey: true,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns foreignKeys", () => {
		const authors = table({
			columns: {
				id: serial(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const books = table({
			columns: {
				id: serial(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], authors, ["id"])
						.updateRule("restrict")
						.deleteRule("cascade"),
				],
			},
		});

		const database = pgDatabase({ tables: { authors, books } });

		const expected = {
			extensions: [],
			tables: {
				authors: {
					primaryKey: ["id"],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: true,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [],
				},
				books: {
					primaryKey: [],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						book_id: {
							dataType: "integer",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
					},
					foreignKeys: [
						{
							columns: ["book_id"],
							targetTable: "authors",
							targetColumns: ["id"],
							deleteRule: "CASCADE",
							updateRule: "RESTRICT",
						},
					],
					uniqueConstraints: [],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns unique constraints", () => {
		const books = table({
			columns: {
				id: serial(),
				book_id: integer(),
				description: text(),
				location: text(),
			},
			constraints: {
				unique: [
					unique(["book_id"]),
					unique(["description", "location"]).nullsNotDistinct(),
				],
			},
		});

		const database = pgDatabase({ tables: { books } });

		const expected = {
			extensions: [],
			tables: {
				books: {
					primaryKey: [],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						book_id: {
							dataType: "integer",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
						description: {
							dataType: "text",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
						location: {
							dataType: "text",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [
						{
							columns: ["book_id"],
							nullsDistinct: true,
						},
						{
							columns: ["description", "location"],
							// eslint-disable-next-line max-lines
							nullsDistinct: false,
						},
					],
					triggers: [],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});

	test("introspection returns triggers", () => {
		const books = table({
			columns: {
				id: serial(),
				book_id: integer(),
				description: text(),
				location: text(),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["delete"])
					.forEach("statement")
					.condition(sql<string>`OLD.balance IS DISTINCT FROM NEW.balance`)
					.referencingOldTableAs("old_table")
					.function("check_account_update", [{ value: "hello" }]),
			},
		});

		const database = pgDatabase({ tables: { books } });

		const expected = {
			extensions: [],
			tables: {
				books: {
					primaryKey: [],
					columns: {
						id: {
							dataType: "serial",
							nullable: false,
							generated: true,
							defaultValue: null,
							primaryKey: false,
						},
						book_id: {
							dataType: "integer",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
						description: {
							dataType: "text",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
						location: {
							dataType: "text",
							nullable: true,
							generated: false,
							defaultValue: null,
							primaryKey: false,
						},
					},
					foreignKeys: [],
					uniqueConstraints: [],
					triggers: [
						{
							name: "foo_before_update",
							events: ["delete"],
							firingTime: "before",
							forEach: "statement",
							condition: "OLD.balance IS DISTINCT FROM NEW.balance",
							functionArgs: [
								{
									value: "hello",
								},
							],
							functionName: "check_account_update",
							referencingOldTableAs: "old_table",
						},
					],
				},
			},
		};
		expect(database.instrospect()).toStrictEqual(expected);
	});
});
