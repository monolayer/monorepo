import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { table } from "~/database/schema/table/table.js";
import {
	databaseTableDependencies,
	localSchemaTableDependencies,
	sortTableDependencies,
} from "~/introspection/table-dependencies.js";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Table create migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("database table dependencies", async (context) => {
		await context.kysely.schema
			.createTable("buildings")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("buildings")
			.addPrimaryKeyConstraint("buildings_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("rooms")
			.addColumn("id", "integer")
			.addColumn("building_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("rooms")
			.addForeignKeyConstraint(
				"rooms_buildings_fk",
				["building_id"],
				"buildings",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("videos")
			.addColumn("id", "integer")
			.addColumn("poster_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("videos")
			.addPrimaryKeyConstraint("videos_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("posters")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("posters")
			.addPrimaryKeyConstraint("posters_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.addColumn("video_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint("users_books_fk", ["book_id"], "books", ["id"])
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint("users_videos_fk", ["video_id"], "videos", [
				"id",
			])
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		await context.kysely.schema
			.alterTable("videos")
			.addForeignKeyConstraint("videos_posters_fk", ["poster_id"], "posters", [
				"id",
			])
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		await context.kysely.schema
			.alterTable("posters")
			.addForeignKeyConstraint("posters_books_fk", ["book_id"], "books", ["id"])
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const result = await databaseTableDependencies(context.kysely, "public", [
			"books",
			"users",
			"videos",
			"posters",
		]);

		const expected = ["users", "videos", "posters", "books"];
		expect(result).toEqual(expected);
	});

	test<DbContext>("local schema table dependencies", () => {
		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const posters = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				foreignKeys: [foreignKey(["bookId"], books, ["id"])],
			},
		});

		const videos = table({
			columns: {
				id: integer(),
				posterId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				foreignKeys: [foreignKey(["posterId"], posters, ["id"])],
			},
		});

		const users = table({
			columns: {
				id: integer(),
				bookId: integer(),
				videoId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				foreignKeys: [
					foreignKey(["videoId"], videos, ["id"]),
					foreignKey(["bookId"], books, ["id"]),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				books,
				videos,
				posters,
			},
		});

		const result = localSchemaTableDependencies(dbSchema);
		const expected = ["users", "videos", "posters", "books"];

		expect(result).toEqual(expected);
	});

	test<DbContext>("sort dependencies", () => {
		const tablesToRename = [
			{ from: "users", to: "new_users" },
			{ from: "posters", to: "new_posters" },
			{ from: "books", to: "new_books" },
		];

		const dbDependencies = ["users", "videos", "posters", "books"];

		const localDependencies = [
			"users",
			"videos",
			"posters",
			"books",
			"buildings",
		];

		const expected = [
			"users",
			"new_users",
			"videos",
			"posters",
			"new_posters",
			"books",
			"new_books",
			"buildings",
		];

		expect(
			sortTableDependencies(dbDependencies, localDependencies, tablesToRename),
		).toEqual(expected);
	});
});
