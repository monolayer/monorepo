/* eslint-disable max-lines */
import { expect, test } from "vitest";
import { renderChangesetSummary } from "~/changeset/print-changeset-summary.js";
import type { Changeset } from "~/changeset/types.js";

test("print summary", () => {
	const changeset = [
		{
			priority: 0,
			tableName: "none",
			currentTableName: "none",
			schemaName: null,
			type: "createSchema",
			up: [],
			down: [],
		},
		{
			priority: 1,
			tableName: "none",
			currentTableName: "none",
			schemaName: null,
			type: "createExtension",
			up: [],
			down: [
				["await sql`DROP EXTENSION IF EXISTS moddatetime;`", "execute(db);"],
			],
		},
		{
			priority: 0,
			tableName: "none",
			currentTableName: "none",
			schemaName: null,
			type: "dropExtension",
			up: [],
			down: [],
		},
		{
			priority: 2,
			tableName: "none",
			currentTableName: "none",
			schemaName: "public",
			type: "createEnum",
			up: [],
			down: [],
		},
		{
			priority: 0,
			tableName: "none",
			currentTableName: "none",
			schemaName: "public",
			type: "changeEnum",
			up: [],
			down: [],
		},
		{
			priority: 810,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropIndex",
			up: [],
			down: [],
		},
		{
			priority: 810,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropIndex",
			up: [],
			down: [],
		},
		{
			priority: 810,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "dropIndex",
			up: [],
			down: [],
		},
		{
			priority: 810,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "dropForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 811,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "dropUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 811,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "dropUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 811,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "dropUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 812,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "dropCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 812,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 812,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 900,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "renameTable",
			warnings: [
				{
					code: "BI001",
					schema: "public",
					tableRename: {
						from: "books",
						to: "books_and_documents",
					},
					type: "backwardIncompatible",
				},
			],
			up: [],
			down: [],
		},
		{
			priority: 900,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "renameTable",
			warnings: [
				{
					code: "BI001",
					schema: "public",
					tableRename: {
						from: "trigger_table",
						to: "triggers",
					},
					type: "backwardIncompatible",
				},
			],
			up: [],
			down: [],
		},
		{
			priority: 1001,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "dropTrigger",
			up: [],
			down: [],
		},
		{
			priority: 1001,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "dropTrigger",
			up: [],
			down: [],
		},
		{
			priority: 1001,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "dropTrigger",
			up: [],
			down: [],
		},
		{
			down: [],
			priority: 1004,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropPrimaryKey",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "dropColumn",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "dropColumn",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "dropColumn",
			up: [],
		},
		{
			tableName: "devices",
			currentTableName: "devices",
			schemaName: "public",
			type: "dropTable",
			priority: 1006,
			down: [],
			up: [],
		},
		{
			priority: 2001,
			tableName: "accounts",
			currentTableName: "accounts",
			schemaName: "public",
			type: "createTable",
			up: [
				[
					'await db.withSchema("public").schema',
					'createTable("books")',
					'addColumn("json", "json")',
					'addColumn("jsonB", "jsonb")',
					'addColumn("numeric", "numeric")',
					'addColumn("numeric_5", "numeric(5, 0)")',
					'addColumn("numeric_5_2", "numeric(5, 2)")',
				],
			],
			down: [],
		},
		{
			priority: 2001,
			tableName: "notes",
			currentTableName: "notes",
			schemaName: "public",
			type: "createTable",
			up: [],
			down: [],
		},
		{
			down: [],
			priority: 2001,
			tableName: "messages",
			currentTableName: "messages",
			schemaName: "public",
			type: "createTable",
			up: [],
		},
		{
			priority: 2001,
			tableName: "filter",
			currentTableName: "filters",
			schemaName: "public",
			type: "createTable",
			up: [],
			down: [],
		},
		{
			down: [],
			priority: 2001,
			tableName: "regions",
			currentTableName: "regions",
			schemaName: "public",
			type: "createTable",
			up: [],
		},
		{
			down: [],
			priority: 2003,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createColumn",
			up: [],
		},
		{
			down: [],
			priority: 2003,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createColumn",
			up: [],
		},
		{
			down: [],
			priority: 2003,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createColumn",
			up: [],
		},
		{
			down: [],
			priority: 3000,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "renameColumn",
			up: [],
		},
		{
			down: [],
			priority: 3000,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "renameColumn",
			warnings: [
				{
					code: "BI002",
					columnRename: {
						from: "id",
						to: "book_id",
					},
					schema: "public",
					table: "library_building",
					type: "backwardIncompatible",
				},
			],
			up: [],
		},
		{
			down: [],
			priority: 3000,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "renameColumn",
			warnings: [
				{
					code: "BI002",
					columnRename: {
						from: "id",
						to: "book_id",
					},
					schema: "public",
					table: "library_building",
					type: "backwardIncompatible",
				},
			],
			up: [],
		},
		{
			down: [],
			priority: 3001,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3001,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3001,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3002,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3004,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3004,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3004,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3005,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3005,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3005,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3006,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3006,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3006,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3007,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3007,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3007,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3008,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3008,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3008,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			down: [],
			priority: 3009,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "changeColumn",
			up: [],
		},
		{
			priority: 3011,
			tableName: "none",
			currentTableName: "none",
			schemaName: "public",
			type: "dropEnum",
			up: [],
			down: [],
		},
		{
			priority: 3011,
			tableName: "none",
			currentTableName: "none",
			schemaName: "public",
			type: "dropEnum",
			up: [],
			down: [],
		},
		{
			down: [],
			priority: 4001,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createPrimaryKey",
			up: [],
		},
		{
			priority: 4001,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createPrimaryKey",
			up: [],
			down: [],
		},
		{
			priority: 4001,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "createPrimaryKey",
			up: [],
			down: [],
		},
		{
			down: [],
			priority: 4003,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "createIndex",
			up: [],
		},
		{
			down: [],
			priority: 4003,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createIndex",
			up: [],
		},
		{
			down: [],
			priority: 4003,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createIndex",
			up: [],
		},
		{
			down: [],
			priority: 4003,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "createIndex",
			up: [],
		},
		{
			down: [],
			priority: 4003,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "createIndex",
			up: [],
		},
		{
			priority: 4004,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "createTrigger",
			up: [],
			down: [],
		},
		{
			priority: 4004,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createTrigger",
			up: [],
			down: [],
		},
		{
			priority: 4004,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "createTrigger",
			up: [],
			down: [],
		},
		{
			priority: 4010,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 4010,
			tableName: "books",
			currentTableName: "books_and_documents",
			schemaName: "public",
			type: "createUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 4010,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 4011,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "createForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 4011,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 4011,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 4012,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 4012,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "createCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 4012,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "createCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "renameIndex",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "renameIndex",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "renameIndex",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "renameForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "trigger_table",
			currentTableName: "triggers",
			schemaName: "public",
			type: "renameForeignKey",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "new_books",
			currentTableName: "new_books",
			schemaName: "public",
			type: "renameUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "renameUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "renameUniqueConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "renameCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "library_building",
			currentTableName: "library_building",
			schemaName: "public",
			type: "renameCheckConstraint",
			up: [],
			down: [],
		},
		{
			priority: 5002,
			tableName: "users",
			currentTableName: "users",
			schemaName: "public",
			type: "renameCheckConstraint",
			up: [],
			down: [],
		},
	] as Changeset[];

	expect(stripAnsiCodes(renderChangesetSummary(changeset))).toStrictEqual(
		expectedSummary,
	);
});

const stripAnsiCodes = (str: string) =>
	// eslint-disable-next-line no-control-regex
	str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");

const expectedSummary = `Extensions: added (1), dropped (1)
Schemas: added (1)

'public' schema:

  Enum Types: added (1), dropped (2), changed (1)

  'books_and_documents' table (renamed from 'books')
    columns: added (1), dropped (1), changed (5)
    primary keys: added (1), dropped (1)
    unique constraints: added (2)
    check constraints: dropped (2)
    indexes: added (1), dropped (2)
    triggers: added (1)

  'new_books' table
    columns: added (2), dropped (2), changed (3), renamed (1)
    primary keys: added (1)
    foreign keys: added (2)
    unique constraints: added (1), renamed (1)
    check constraints: added (2)
    indexes: added (1), dropped (1)

  'library_building' table
    columns: changed (4), renamed (2)
    primary keys: added (1)
    foreign keys: dropped (1)
    unique constraints: dropped (1)
    check constraints: renamed (2)
    indexes: added (2)

  'users' table
    columns: changed (6)
    foreign keys: added (1)
    unique constraints: dropped (2), renamed (2)
    check constraints: renamed (1)
    indexes: added (1), renamed (1)
    triggers: dropped (1)

  'triggers' table (renamed from 'trigger_table')
    columns: changed (6)
    foreign keys: renamed (2)
    check constraints: added (1), dropped (1)
    indexes: renamed (2)
    triggers: added (2), dropped (2)

  'devices' table (dropped)

  'accounts' table (added)
    columns: added (5)

  'notes' table (added)

  'messages' table (added)

  'filters' table (added)

  'regions' table (added)
`;
