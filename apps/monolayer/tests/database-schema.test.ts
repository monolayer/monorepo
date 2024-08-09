import { tableInfo } from "@monorepo/pg/introspection/table.js";
import { boolean } from "@monorepo/pg/schema/column/data-types/boolean.js";
import { varchar } from "@monorepo/pg/schema/column/data-types/character-varying.js";
import { enumType } from "@monorepo/pg/schema/column/data-types/enum.js";
import { enumerated } from "@monorepo/pg/schema/column/data-types/enumerated.js";
import { serial } from "@monorepo/pg/schema/column/data-types/serial.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { Schema, schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";

describe("schema definition", () => {
	test("without tables", () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const dbSchema = schema({ tables: {} });
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const dbSchema = schema({});
	type InferredDBTypes = typeof dbSchema.infer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type ExpectedType = any;

	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});
