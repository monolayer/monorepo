import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/schema/extension/extension.js";
import { pgDatabase } from "~/schema/pg-database.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { timestamp } from "~/schema/table/column/data-types/timestamp.js";
import { table } from "~/schema/table/table.js";
import { trigger } from "~/schema/table/trigger/trigger.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { type DbContext } from "~tests/setup/kysely.js";
import { setUpContext, teardownContext } from "../../helpers/test-context.js";

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
			.addColumn("updatedAt", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '9ff7b5b715046baeffdb1af30ed68f6e43b40bf43d1f76734de5b26ecacb58e8'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`CURRENT_TIMESTAMP`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
				foo_after_update: trigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
			},
		});

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
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
EXECUTE FUNCTION moddatetime('updatedAt');COMMENT ON TRIGGER foo_before_update_trg ON users IS '10989c272b6a6d0fd27c4c8374d3fa195f2f807743dc05c6862407641426841a';\`.execute(db);`,
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
EXECUTE FUNCTION moddatetime('updatedAt');COMMENT ON TRIGGER foo_after_update_trg ON users IS '05a71d7d9db4bee1c9ffe520a6df2fbcf1a755f44d6139dc700d875fe2f0bc69';\`.execute(db);`,
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

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f'`.execute(
			context.kysely,
		);

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

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
			},
		});

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
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

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f'`.execute(
			context.kysely,
		);

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

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
			},
		});

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
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
EXECUTE FUNCTION moddatetime('updatedAt');COMMENT ON TRIGGER foo_before_update_trg ON users IS '84d15b30db78fd48793b7972cd85a0c602637ff2aa4b5429df8c9d0374be95ce';\`.execute(db);`,
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
