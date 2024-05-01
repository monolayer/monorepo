/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Schema, schema } from "~/database/schema/schema.js";
import { boolean } from "~/database/schema/table/column/data-types/boolean.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { enumerated } from "~/database/schema/table/column/data-types/enumerated.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { table } from "~/database/schema/table/table.js";
import { enumType } from "~/database/schema/types/enum/enum.js";
import { tableInfo } from "~/introspection/helpers.js";

describe("schema definition", () => {
	test("without tables", () => {
		const dbSchema = schema({ tables: {} });
		// eslint-disable-next-line @typescript-eslint/ban-types
		const expect: Expect<Equal<typeof dbSchema, Schema<{}, "public">>> = true;
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
		const dbSchema = schema({
			tables: { users, teams },
		});
		const tables = Schema.info(dbSchema).tables;
		expect(tables.users).toBe(users);
		expect(tables.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof dbSchema,
				Schema<{ users: typeof users; teams: typeof teams }, "public">
			>
		> = true;
		expectTypeOf(expectation).toMatchTypeOf<boolean>();
	});

	test("set schema name on tables", () => {
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

		const dbSchema = schema({
			tables: { users, teams },
		});

		const statsSchema = schema({
			name: "stats",
			tables: { users, teams },
		});

		const statsTables = Schema.info(statsSchema).tables;
		expect(tableInfo(statsTables.users!).schemaName).toBe("stats");
		expect(tableInfo(statsTables.teams!).schemaName).toBe("stats");

		const tables = Schema.info(dbSchema).tables;
		expect(tableInfo(tables.users!).schemaName).toBe("public");
		expect(tableInfo(tables.teams!).schemaName).toBe("public");
	});
});

test("with enumerated types", () => {
	const status = enumType("status", ["online", "offline"]);
	const users = table({
		columns: {
			name: varchar(),
			status: enumerated(status),
		},
	});
	const dbSchema = schema({
		types: [status],
		tables: {
			users,
		},
	});
	const tables = Schema.info(dbSchema).tables;
	expect(tables.users).toBe(users);
});

test("types for Kysely with default public schema", () => {
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
	const dbSchema = schema({
		tables: {
			users,
			books,
		},
	});

	type ExpectedType = {
		users: typeof users.infer;
		books: typeof books.infer;
	};
	type InferredDBTypes = typeof dbSchema.infer;

	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();

	type ExpectedTypeWithSchema = {
		"public.users": typeof users.infer;
		"public.books": typeof books.infer;
	};
	type InferredDBTypesWithSchema = typeof dbSchema.inferWithSchemaNamespace;
	const dbExpectWithSchema: Expect<
		Equal<InferredDBTypesWithSchema, ExpectedTypeWithSchema>
	> = true;
	expectTypeOf(dbExpectWithSchema).toMatchTypeOf<boolean>();
});

test("types for Kysely with schema", () => {
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
	const dbSchema = schema({
		name: "demo",
		tables: {
			users,
			books,
		},
	});

	type ExpectedType = {
		users: typeof users.infer;
		books: typeof books.infer;
	};
	type InferredDBTypes = typeof dbSchema.infer;

	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();

	type ExpectedTypeWithSchema = {
		"demo.users": typeof users.infer;
		"demo.books": typeof books.infer;
	};
	type InferredDBTypesWithSchema = typeof dbSchema.inferWithSchemaNamespace;
	const dbExpectWithSchema: Expect<
		Equal<InferredDBTypesWithSchema, ExpectedTypeWithSchema>
	> = true;
	expectTypeOf(dbExpectWithSchema).toMatchTypeOf<boolean>();
});

test("types for Kysely on database without tables", () => {
	const dbSchema = schema({});
	type InferredDBTypes = typeof dbSchema.infer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type ExpectedType = any;

	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});
