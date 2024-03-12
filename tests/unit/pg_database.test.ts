/* eslint-disable max-lines */
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { pgForeignKey } from "~/index.js";
import {
	pgBigserial,
	pgBoolean,
	pgInteger,
	pgSerial,
	pgText,
	pgTime,
	pgTimestamp,
	pgVarchar,
} from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { pgPrimaryKey } from "~/schema/pg_primary_key.js";
import { pgTable } from "~/schema/pg_table.js";
import { pgTrigger } from "~/schema/pg_trigger.js";
import { pgUnique } from "~/schema/pg_unique.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({ tables: {} });
		// eslint-disable-next-line @typescript-eslint/ban-types
		const expect: Expect<Equal<typeof database, pgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = pgTable({
			columns: {
				name: pgVarchar(),
			},
		});
		const teams = pgTable({
			columns: {
				name: pgVarchar(),
			},
		});
		const database = pgDatabase({
			tables: { users, teams },
		});
		expect(database.tables?.users).toBe(users);
		expect(database.tables?.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof database,
				pgDatabase<{ users: typeof users; teams: typeof teams }>
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

	expect(database.extensions).toStrictEqual(["pgcrypto", "btree_gist"]);
});

test("types for Kysely", () => {
	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar().notNull(),
			email: pgText().notNull(),
			address: pgText(),
		},
	});
	const books = pgTable({
		columns: {
			id: pgSerial(),
			title: pgVarchar().notNull(),
			borrowed: pgBoolean().notNull(),
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

	type InferredDBTypes = typeof database.kyselyDatabase;
	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});

describe("introspect", () => {
	test("introspection returns empty primary key", () => {
		const users = pgTable({
			columns: {
				id: pgSerial(),
			},
		});

		const database = pgDatabase({ tables: { users } });

		const expected = {
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
		const users = pgTable({
			columns: {
				id: pgSerial(),
			},
			constraints: {
				primaryKey: pgPrimaryKey(["id"]),
			},
		});

		const database = pgDatabase({ tables: { users } });

		const expected = {
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
		const users = pgTable({
			columns: {
				email: pgText(),
				name: pgInteger().generatedByDefaultAsIdentity(),
			},
			constraints: {
				primaryKey: pgPrimaryKey(["email", "name"]),
			},
		});
		const database = pgDatabase({ tables: { users } });

		const expected = {
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
		const demo = pgTable({
			columns: {
				id: pgSerial(),
				id2: pgBigserial(),
				name: pgText(),
				email: pgText().notNull(),
				count1: pgInteger().generatedByDefaultAsIdentity(),
				count2: pgInteger().generatedAlwaysAsIdentity(),
				description: pgText().default("TDB"),
				createdAt: pgTimestamp().default(sql`now()`),
				time: pgTime(4),
			},
			constraints: {
				primaryKey: pgPrimaryKey(["name", "time"]),
			},
		});

		const database = pgDatabase({ tables: { demo } });

		const expected = {
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
		const authors = pgTable({
			columns: {
				id: pgSerial(),
			},
			constraints: {
				primaryKey: pgPrimaryKey(["id"]),
			},
		});

		const books = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
			},
			constraints: {
				foreignKeys: [
					pgForeignKey(["book_id"], authors, ["id"])
						.updateRule("restrict")
						.deleteRule("cascade"),
				],
			},
		});

		const database = pgDatabase({ tables: { authors, books } });

		const expected = {
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
		const books = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				description: pgText(),
				location: pgText(),
			},
			constraints: {
				unique: [
					pgUnique(["book_id"]),
					pgUnique(["description", "location"]).nullsNotDistinct(),
				],
			},
		});

		const database = pgDatabase({ tables: { books } });

		const expected = {
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
		const books = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				description: pgText(),
				location: pgText(),
			},
			triggers: {
				foo_before_update: pgTrigger()
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
