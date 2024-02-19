import { describe, expect, test } from "vitest";
import { changesetDiff } from "~/database/changeset.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { foreignKeyMigrationOps } from "./foreign_key.js";

describe("foreignKeyMigrationOps", () => {
	test("add foreign key constraint", () => {
		const local = migrationSchemaFactory({
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = foreignKeyMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 2004,
				tableName: "users",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_book_id_books_id_kinetic_fk`.execute(db);",
				],
			},
			{
				priority: 2004,
				tableName: "books",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("add foreign key on table creation", () => {
		const local = migrationSchemaFactory({
			table: {
				users: {},
			},
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = foreignKeyMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 2004,
				tableName: "users",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
				down: [],
			},
			{
				priority: 2004,
				tableName: "books",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop foreign key constraint", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = foreignKeyMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_book_id_books_id_kinetic_fk`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop foreign key constraint when dropping a table", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			table: {
				users: {},
			},
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = foreignKeyMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("replace unique constraint", () => {
		const local = migrationSchemaFactory({
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
				},
			},
		});
		const remote = migrationSchemaFactory({
			foreignKeyConstraints: {
				users: {
					users_book_id_books_id_kinetic_fk:
						"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
				books: {
					books_location_id_locations_id_kinetic_fk:
						"books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = foreignKeyMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 4002,
				tableName: "users",
				type: "changeConstraint",
				up: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_book_id_books_id_kinetic_fk, ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_book_id_books_id_kinetic_fk, ADD CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "changeConstraint",
				up: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk, ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_location_id_locations_id_kinetic_fk, ADD CONSTRAINT books_location_id_locations_id_kinetic_fk FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE ON UPDATE CASCADE`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});
});
