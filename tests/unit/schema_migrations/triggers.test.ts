import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { pgInteger, pgTimestamp } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { pgTrigger } from "~/database/schema/pg_trigger.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { type DbContext } from "~tests/setup.js";
import { setUpContext, teardownContext } from "../../helpers/test_context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		const users = pgTable({
			columns: {
				id: pgInteger(),
				updatedAt: pgTimestamp().defaultTo(sql`now()`),
			},
			triggers: {
				foo_before_update: pgTrigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", ["updatedAt"]),
				foo_after_update: pgTrigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", ["updatedAt"]),
			},
		});

		const database = pgDatabase({
			extensions: ["moddatetime"],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`.execute(db);"],
				],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updatedAt);COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';\`.execute(db);`,
					],
				],
				down: [
					[
						"await sql`DROP TRIGGER foo_before_update_trg ON users`.execute(db);",
					],
				],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_after_update_trg
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updatedAt);COMMENT ON TRIGGER foo_after_update_trg ON users IS '9463c7cd1a3fb577535fade640246675d0ac4097b6ed86ae9452363b82e43b0f';\`.execute(db);`,
					],
				],
				down: [
					[
						"await sql`DROP TRIGGER foo_after_update_trg ON users`.execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg
								BEFORE UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_after_update_trg
								AFTER UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_after_update_trg ON users IS '9463c7cd1a3fb577535fade640246675d0ac4097b6ed86ae9452363b82e43b0f';`.execute(
			context.kysely,
		);

		const users = pgTable({
			columns: {
				id: pgInteger(),
				updatedAt: pgTimestamp().defaultTo(sql`now()`),
			},
		});

		const database = pgDatabase({
			extensions: ["moddatetime"],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [
					[
						"await sql`DROP TRIGGER foo_before_update_trg ON users`.execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat');COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(db);",
					],
				],
			},
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [
					[
						"await sql`DROP TRIGGER foo_after_update_trg ON users`.execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_after_update_trg AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat');COMMENT ON TRIGGER foo_after_update_trg ON users IS '9463c7cd1a3fb577535fade640246675d0ac4097b6ed86ae9452363b82e43b0f';`.execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "same",
		});
	});

	test<DbContext>("change trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg
								BEFORE UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(
			context.kysely,
		);

		const users = pgTable({
			columns: {
				id: pgInteger(),
				updatedAt: pgTimestamp().defaultTo(sql`now()`),
			},
			triggers: {
				foo_before_update: pgTrigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", ["updatedAt"]),
			},
		});

		const database = pgDatabase({
			extensions: ["moddatetime"],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 5003,
				tableName: "users",
				type: "updateTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updatedAt);COMMENT ON TRIGGER foo_before_update_trg ON users IS '4d94ebd94ecb1913d10aea79e05375e5dabea4ad3c2058570f561a51c01d5897';\`.execute(db);`,
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat');COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});
});
