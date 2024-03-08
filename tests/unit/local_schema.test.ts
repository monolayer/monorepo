import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import {
	localSchema,
	schemaColumnInfo,
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
	schemaDbEnumInfo,
} from "~/database/introspection/local_schema.js";
import {
	ColumnIdentity,
	pgBigserial,
	pgBoolean,
	pgEnum,
	pgInteger,
	pgSerial,
	pgTimestamp,
	pgVarchar,
} from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgIndex } from "~/database/schema/pg_index.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { pgForeignKey } from "../../src/database/schema/pg_foreign_key.js";
import { pgTable } from "../../src/database/schema/pg_table.js";
import { pgTrigger } from "../../src/database/schema/pg_trigger.js";
import { pgUnique } from "../../src/database/schema/pg_unique.js";

describe("#schemaColumnInfo", () => {
	test("default column", () => {
		const column = pgVarchar(100);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("not null column", () => {
		const column = pgVarchar(100).notNull();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			isNullable: false,
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with defaultTo default data type", () => {
		const column = pgVarchar(100).defaultTo("foo");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			defaultValue: "'foo'::character varying",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with defaultTo with expression", () => {
		const column = pgTimestamp().defaultTo(sql`CURRENT_TIMESTAMP`);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "timestamp",
			defaultValue: "CURRENT_TIMESTAMP",
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with renameFrom", () => {
		const column = pgVarchar(100).renameFrom("old_column_name");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			renameFrom: "old_column_name",
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with always as identity", () => {
		const column = pgInteger().generatedAlwaysAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "integer",
			identity: ColumnIdentity.Always,
			isNullable: false,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with by default as identity", () => {
		const column = pgInteger().generatedByDefaultAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "integer",
			identity: ColumnIdentity.ByDefault,
			isNullable: false,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});
});

test("#schemaDBColumnInfoByTable on empty database", () => {
	const database = pgDatabase({ tables: {} });
	expect(schemaDBColumnInfoByTable(database, migrationSchemaFactory())).toEqual(
		{},
	);
});

test("#schemaDBColumnInfoByTable", () => {
	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar().notNull(),
			email: pgVarchar().notNull(),
			role: pgEnum("role", ["user", "admin", "superuser"]),
		},
	});
	const teams = pgTable({
		columns: {
			id: pgBigserial(),
			name: pgVarchar().notNull(),
			active: pgBoolean(),
		},
	});
	const database = pgDatabase({
		tables: {
			users,
			teams,
		},
	});
	const expectedDbColumnInfoByTable = {
		users: {
			id: columnInfoFactory({
				tableName: "users",
				columnName: "id",
				dataType: "serial",
				isNullable: false,
			}),
			name: columnInfoFactory({
				tableName: "users",
				columnName: "name",
				dataType: "varchar",
				isNullable: false,
			}),
			email: columnInfoFactory({
				tableName: "users",
				columnName: "email",
				dataType: "varchar",
				isNullable: false,
			}),
			role: columnInfoFactory({
				tableName: "users",
				columnName: "role",
				dataType: "role",
				enum: true,
			}),
		},
		teams: {
			id: columnInfoFactory({
				tableName: "teams",
				columnName: "id",
				dataType: "bigserial",
				isNullable: false,
			}),
			name: columnInfoFactory({
				tableName: "teams",
				columnName: "name",
				dataType: "varchar",
				isNullable: false,
			}),
			active: columnInfoFactory({
				tableName: "teams",
				columnName: "active",
				dataType: "boolean",
				isNullable: true,
			}),
		},
	};
	expect(schemaDBColumnInfoByTable(database, migrationSchemaFactory())).toEqual(
		expectedDbColumnInfoByTable,
	);
});

test("#schemaDBIndexInfoByTable", () => {
	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar().notNull(),
			email: pgVarchar().notNull(),
		},
		indexes: [pgIndex(["name"]), pgIndex(["email", "id"])],
	});
	const teams = pgTable({
		columns: {
			id: pgBigserial(),
			name: pgVarchar().notNull(),
			active: pgBoolean(),
		},
		indexes: [pgIndex(["id"]), pgIndex(["active"])],
	});
	const database = pgDatabase({
		tables: {
			users,
			teams,
		},
	});
	expect(schemaDBIndexInfoByTable(database)).toStrictEqual({
		teams: {
			teams_active_kntc_idx:
				'c3c6080ff3d3e7bf8b6a6e729aff7aa2f79712f924cdc454cc615595f940a1e6:create index "teams_active_kntc_idx" on "teams" ("active")',
			teams_id_kntc_idx:
				'43e5590f52736483e6877c00bccaf65586bb6dd7fae45bdc8159a05d2521dd7c:create index "teams_id_kntc_idx" on "teams" ("id")',
		},
		users: {
			users_email_id_kntc_idx:
				'92c9e11e110ccb2b5d3c2c3cf34ddc9747a900cc7d3ab700763b92c4c00bf689:create index "users_email_id_kntc_idx" on "users" ("email", "id")',
			users_name_kntc_idx:
				'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45:create index "users_name_kntc_idx" on "users" ("name")',
		},
	});
});

test("#schemaDbEnumInfo", () => {
	const books = pgTable({
		columns: {
			id: pgSerial(),
			status: pgEnum("book_status", ["available", "checked_out", "lost"]),
		},
	});

	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar(),
			status: pgEnum("user_status", ["active", "inactive"]),
		},
	});

	const database = pgDatabase({
		tables: { users, books },
	});

	expect(schemaDbEnumInfo(database)).toStrictEqual({
		book_status: "available, checked_out, lost",
		user_status: "active, inactive",
	});
});

test("#localSchema", () => {
	const books = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar(),
			location: pgVarchar(),
			status: pgEnum("book_status", ["available", "checked_out", "lost"]),
		},
		indexes: [pgIndex(["name"])],
		uniqueConstraints: [pgUnique(["name", "location"])],
	});

	const users = pgTable({
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarchar().notNull(),
			email: pgVarchar().notNull(),
			book_id: pgInteger(),
			status: pgEnum("user_status", ["active", "inactive"]),
		},
		foreignKeys: [pgForeignKey(["book_id"], books, ["id"])],
		uniqueConstraints: [
			pgUnique(["name"]),
			pgUnique(["email"]).nullsNotDistinct(),
		],
		triggers: {
			foo_before_update: pgTrigger()
				.fireWhen("before")
				.events(["update"])
				.forEach("statement")
				.function("foo"),
		},
	});

	const teams = pgTable({
		columns: {
			id: pgBigserial().primaryKey(),
			name: pgVarchar().notNull(),
			active: pgBoolean(),
		},
		indexes: [pgIndex(["name"])],
		triggers: {
			foo_before_insert: pgTrigger()
				.fireWhen("before")
				.events(["insert"])
				.forEach("row")
				.function("foo"),
		},
	});

	const database = pgDatabase({
		extensions: ["cube", "btree_gin"],
		tables: {
			users,
			teams,
			books,
		},
	});

	const expectedLocalSchema = {
		table: {
			books: {
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
				location: {
					characterMaximumLength: null,
					columnName: "location",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
				status: {
					characterMaximumLength: null,
					columnName: "status",
					dataType: "book_status",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: true,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
			},
			teams: {
				active: {
					characterMaximumLength: null,
					columnName: "active",
					dataType: "boolean",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "teams",
					enum: false,
				},
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "bigserial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "teams",
					enum: false,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "teams",
					enum: false,
				},
			},
			users: {
				book_id: {
					characterMaximumLength: null,
					columnName: "book_id",
					dataType: "integer",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				email: {
					characterMaximumLength: null,
					columnName: "email",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				status: {
					characterMaximumLength: null,
					columnName: "status",
					dataType: "user_status",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: true,
				},
			},
		},
		index: {
			books: {
				books_name_kntc_idx:
					'77f3737b4f672295b1204a55da66fa8873cf81ba7ae3d785480c618455e3ac22:create index "books_name_kntc_idx" on "books" ("name")',
			},
			teams: {
				teams_name_kntc_idx:
					'590d0c8227f1792fe07fe7f16202b6a6ea954932810010733646dbcd46d88618:create index "teams_name_kntc_idx" on "teams" ("name")',
			},
		},
		foreignKeyConstraints: {
			users: {
				users_book_id_books_id_kinetic_fk:
					'"users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
			},
		},
		uniqueConstraints: {
			users: {
				users_email_kinetic_key:
					'"users_email_kinetic_key" UNIQUE NULLS NOT DISTINCT ("email")',
				users_name_kinetic_key:
					'"users_name_kinetic_key" UNIQUE NULLS DISTINCT ("name")',
			},
			books: {
				books_location_name_kinetic_key:
					'"books_location_name_kinetic_key" UNIQUE NULLS DISTINCT ("location", "name")',
			},
		},
		primaryKey: {
			teams: {
				teams_id_kinetic_pk: '"teams_id_kinetic_pk" PRIMARY KEY ("id")',
			},
			users: {
				users_id_kinetic_pk: '"users_id_kinetic_pk" PRIMARY KEY ("id")',
			},
		},
		extensions: { btree_gin: true, cube: true },
		triggers: {
			teams: {
				foo_before_insert_trg:
					"05c8db6554999531138ecba0b32e1f47595be0f4210f28e8b955e98b1fa06f3a:CREATE OR REPLACE TRIGGER foo_before_insert_trg\nBEFORE INSERT ON teams\nFOR EACH ROW\nEXECUTE FUNCTION foo",
			},
			users: {
				foo_before_update_trg:
					"a2b86e379795876db3ca7ffb7ae373b26287a1be74a33c46eee8a4d789e2a9f6:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON users\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo",
			},
		},
		enums: {
			book_status: "available, checked_out, lost",
			user_status: "active, inactive",
		},
	};
	expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
		expectedLocalSchema,
	);
});

test("trigger names are downcased", () => {
	const users = pgTable({
		columns: {
			id: pgSerial(),
		},
		triggers: {
			foo_Before_update: pgTrigger()
				.fireWhen("before")
				.events(["update"])
				.forEach("statement")
				.function("foo"),
		},
	});

	const database = pgDatabase({
		tables: {
			users,
		},
	});

	const expectedLocalSchema = {
		table: {
			users: {
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
			},
		},
		triggers: {
			users: {
				foo_before_update_trg:
					"a2b86e379795876db3ca7ffb7ae373b26287a1be74a33c46eee8a4d789e2a9f6:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON users\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo",
			},
		},
		extensions: {},
		foreignKeyConstraints: {},
		index: {},
		primaryKey: {},
		uniqueConstraints: {},
		enums: {},
	};
	expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
		expectedLocalSchema,
	);
});

test("#localSchemaCamelCase", () => {
	const books = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar(),
			location: pgVarchar(),
			status: pgEnum("book_status", ["available", "checked_out", "lost"]),
		},
		indexes: [pgIndex(["name"])],
		uniqueConstraints: [pgUnique(["name", "location"])],
	});

	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar().notNull(),
			fullName: pgVarchar().primaryKey(),
			email: pgVarchar().notNull(),
			bookId: pgInteger(),
			status: pgEnum("user_status", ["active", "inactive"]),
		},
		indexes: [pgIndex(["fullName"])],
		foreignKeys: [pgForeignKey(["bookId"], books, ["id"])],
		uniqueConstraints: [
			pgUnique(["name"]),
			pgUnique(["fullName"]),
			pgUnique(["email"]).nullsNotDistinct(),
		],
		triggers: {
			foo_before_update: pgTrigger()
				.fireWhen("before")
				.events(["update"])
				.forEach("statement")
				.function("foo"),
		},
	});

	const database = pgDatabase({
		extensions: ["cube", "btree_gin"],
		tables: {
			users,
			books,
			new_books: books,
		},
	});

	const expectedLocalSchema = {
		table: {
			books: {
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
				location: {
					characterMaximumLength: null,
					columnName: "location",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
				status: {
					characterMaximumLength: null,
					columnName: "status",
					dataType: "book_status",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: true,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "books",
					enum: false,
				},
			},
			new_books: {
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "new_books",
					enum: false,
				},
				location: {
					characterMaximumLength: null,
					columnName: "location",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "new_books",
					enum: false,
				},
				status: {
					characterMaximumLength: null,
					columnName: "status",
					dataType: "book_status",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "new_books",
					enum: true,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "new_books",
					enum: false,
				},
			},
			users: {
				book_id: {
					characterMaximumLength: null,
					columnName: "book_id",
					dataType: "integer",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				email: {
					characterMaximumLength: null,
					columnName: "email",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				full_name: {
					characterMaximumLength: null,
					columnName: "full_name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: false,
				},
				status: {
					characterMaximumLength: null,
					columnName: "status",
					dataType: "user_status",
					datetimePrecision: null,
					defaultValue: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					renameFrom: null,
					tableName: "users",
					enum: true,
				},
			},
		},
		index: {
			books: {
				books_name_kntc_idx:
					'77f3737b4f672295b1204a55da66fa8873cf81ba7ae3d785480c618455e3ac22:create index "books_name_kntc_idx" on "books" ("name")',
			},
			new_books: {
				new_books_name_kntc_idx:
					'd57da4dbeafbb0aa3a8de18a1a3a010c0880869f14afea3f222c5dbf349995c6:create index "new_books_name_kntc_idx" on "new_books" ("name")',
			},
			users: {
				users_full_name_kntc_idx:
					'0a2fa263f5ca54fa5d8dbb61c10f9a31c5c124e2482191f4ff7d1e6e0c9771ce:create index "users_full_name_kntc_idx" on "users" ("full_name")',
			},
		},
		foreignKeyConstraints: {
			users: {
				users_book_id_books_id_kinetic_fk:
					'"users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
			},
		},
		uniqueConstraints: {
			users: {
				users_email_kinetic_key:
					'"users_email_kinetic_key" UNIQUE NULLS NOT DISTINCT ("email")',
				users_name_kinetic_key:
					'"users_name_kinetic_key" UNIQUE NULLS DISTINCT ("name")',
				users_full_name_kinetic_key:
					'"users_full_name_kinetic_key" UNIQUE NULLS DISTINCT ("full_name")',
			},
			books: {
				books_location_name_kinetic_key:
					'"books_location_name_kinetic_key" UNIQUE NULLS DISTINCT ("location", "name")',
			},
			new_books: {
				new_books_location_name_kinetic_key:
					'"new_books_location_name_kinetic_key" UNIQUE NULLS DISTINCT ("location", "name")',
			},
		},
		primaryKey: {
			users: {
				users_full_name_kinetic_pk:
					'"users_full_name_kinetic_pk" PRIMARY KEY ("full_name")',
			},
		},
		extensions: { btree_gin: true, cube: true },
		triggers: {
			users: {
				foo_before_update_trg:
					"a2b86e379795876db3ca7ffb7ae373b26287a1be74a33c46eee8a4d789e2a9f6:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON users\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo",
			},
		},
		enums: {
			book_status: "available, checked_out, lost",
			user_status: "active, inactive",
		},
	};
	expect(
		localSchema(database, migrationSchemaFactory(), {
			enabled: true,
			options: {},
		}),
	).toStrictEqual(expectedLocalSchema);
});
