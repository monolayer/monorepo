import { databaseTableDependencies } from "@monorepo/pg/introspection/introspection/introspection.js";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
			.addPrimaryKeyConstraint("buildings_pkey", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("rooms")
			.addColumn("id", "integer")
			.addColumn("building_id", "integer", (col) => col.notNull())
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
			.addColumn("id", "integer", (col) => col.notNull())
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_pkey", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("videos")
			.addColumn("id", "integer")
			.addColumn("poster_id", "integer", (col) => col.notNull())
			.execute();

		await context.kysely.schema
			.alterTable("videos")
			.addPrimaryKeyConstraint("videos_pkey", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("posters")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer", (col) => col.notNull())
			.execute();

		await context.kysely.schema
			.alterTable("posters")
			.addPrimaryKeyConstraint("posters_pkey", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer", (col) => col.notNull())
			.addColumn("video_id", "integer", (col) => col.notNull())
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

		const expected = ["books", "posters", "videos", "users"];
		expect(result).toEqual(expected);
	});
});
