/* eslint-disable max-lines */
import { sql } from "kysely";
import { describe, expect, test, type Mock } from "vitest";
import { extension } from "~/index.js";
import { localSchema } from "~/introspection/schemas.js";
import { pgDatabase } from "~/schema/pg-database.js";
import { bigserial } from "~/schema/table/column/data-types/bigserial.js";
import { boolean } from "~/schema/table/column/data-types/boolean.js";
import { varchar } from "~/schema/table/column/data-types/character-varying.js";
import { enumerated } from "~/schema/table/column/data-types/enumerated.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { serial } from "~/schema/table/column/data-types/serial.js";
import { timestamp } from "~/schema/table/column/data-types/timestamp.js";
import {
	localColumnInfoByTable,
	schemaColumnInfo,
} from "~/schema/table/column/instrospection.js";
import { check } from "~/schema/table/constraints/check/check.js";
import { foreignKey } from "~/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/schema/table/constraints/primary-key/primary-key.js";
import { index } from "~/schema/table/index/index.js";
import { localIndexInfoByTable } from "~/schema/table/index/introspection.js";
import { enumType } from "~/schema/types/enum/enum.js";
import { localEnumInfo } from "~/schema/types/enum/introspection.js";
import { columnInfoFactory } from "~tests/helpers/factories/column-info-factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration-schema.js";
import { unique } from "../../src/schema/table/constraints/unique/unique.js";
import { table } from "../../src/schema/table/table.js";
import { trigger } from "../../src/schema/table/trigger/trigger.js";

describe("#schemaColumnInfo", () => {
	test("default column", () => {
		const column = varchar(100);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "character varying(100)",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("not null column", () => {
		const column = varchar(100).notNull();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "character varying(100)",
			isNullable: false,
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with default default data type", () => {
		const column = varchar(100).default("foo");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "character varying(100)",
			defaultValue:
				"2bc6768278e7f14b6f18480c616c1687a575d330a2e8e471a48bede1a90d5720:'foo'::character varying",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with default with expression", () => {
		const column = timestamp().default(sql`CURRENT_TIMESTAMP`);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "timestamp",
			defaultValue:
				"9ff7b5b715046baeffdb1af30ed68f6e43b40bf43d1f76734de5b26ecacb58e8:CURRENT_TIMESTAMP",
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with renameFrom", () => {
		const column = varchar(100).renameFrom("old_column_name");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "character varying(100)",
			characterMaximumLength: 100,
			renameFrom: "old_column_name",
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with always as identity", () => {
		const column = integer().generatedAlwaysAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "integer",
			identity: "ALWAYS",
			isNullable: false,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with by default as identity", () => {
		const column = integer().generatedByDefaultAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "integer",
			identity: "BY DEFAULT",
			isNullable: false,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});
});

test("#schemaDBColumnInfoByTable on empty database", () => {
	const database = pgDatabase({ tables: {} });
	expect(localColumnInfoByTable(database, migrationSchemaFactory())).toEqual(
		{},
	);
});

test("#schemaDBColumnInfoByTable", () => {
	const users = table({
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: varchar().notNull(),
			role: enumerated(enumType("role", ["user", "admin", "superuser"])),
		},
	});
	const teams = table({
		columns: {
			id: bigserial(),
			name: varchar().notNull(),
			active: boolean(),
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
				dataType: "character varying",
				isNullable: false,
			}),
			email: columnInfoFactory({
				tableName: "users",
				columnName: "email",
				dataType: "character varying",
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
				dataType: "character varying",
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
	expect(localColumnInfoByTable(database, migrationSchemaFactory())).toEqual(
		expectedDbColumnInfoByTable,
	);
});

test("#schemaDBIndexInfoByTable", () => {
	const users = table({
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: varchar().notNull(),
		},
		indexes: [index(["name"]), index(["email", "id"])],
	});
	const teams = table({
		columns: {
			id: bigserial(),
			name: varchar().notNull(),
			active: boolean(),
		},
		indexes: [index(["id"]), index(["active"])],
	});
	const database = pgDatabase({
		tables: {
			users,
			teams,
		},
	});
	expect(localIndexInfoByTable(database)).toStrictEqual({
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
	const bookStatus = enumType("book_status", [
		"available",
		"checked_out",
		"lost",
	]);
	const books = table({
		columns: {
			id: serial(),
			status: enumerated(bookStatus),
		},
	});

	const userStatus = enumType("user_status", ["active", "inactive"]);

	const users = table({
		columns: {
			id: serial(),
			name: varchar(),
			status: enumerated(userStatus),
		},
	});

	const database = pgDatabase({
		types: [bookStatus, userStatus],
		tables: { users, books },
	});

	expect(localEnumInfo(database)).toStrictEqual({
		book_status: "available, checked_out, lost",
		user_status: "active, inactive",
	});
});

type ContextWithRandomHash = {
	randomHash: Mock<[], string>;
};

describe("schema", () => {
	test("#localSchema", () => {
		const bookStatus = enumType("book_status", [
			"available",
			"checked_out",
			"lost",
		]);
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);
		const books = table({
			columns: {
				id: serial(),
				name: varchar(),
				location: varchar(),
				status: enumerated(bookStatus),
			},
			constraints: {
				unique: [unique(["name", "location"])],
				checks: [firstCheck, secondCheck],
			},
			indexes: [index(["name"])],
		});

		const userStatus = enumType("user_status", ["active", "inactive"]);
		const users = table({
			columns: {
				id: serial(),
				name: varchar().notNull(),
				email: varchar().notNull(),
				book_id: integer(),
				status: enumerated(userStatus),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				foreignKeys: [foreignKey(["book_id"], books, ["id"])],
				unique: [unique(["name"]), unique(["email"]).nullsNotDistinct()],
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("statement")
					.function("foo"),
			},
		});

		const teams = table({
			columns: {
				id: bigserial(),
				name: varchar().notNull(),
				active: boolean(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
			indexes: [index(["name"])],
			triggers: {
				foo_before_insert: trigger()
					.fireWhen("before")
					.events(["insert"])
					.forEach("row")
					.function("foo"),
			},
		});

		const database = pgDatabase({
			extensions: [extension("cube"), extension("btree_gin")],
			types: [bookStatus, userStatus],
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
						datetimePrecision: null,
						defaultValue: null,
						identity: null,
						isNullable: false,
						// eslint-disable-next-line max-lines
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
						dataType: "character varying",
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
						dataType: "character varying",
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
			checkConstraints: {
				books: {
					"918b4271_kinetic_chk": '918b4271:"id" > 50',
					e37c55a5_kinetic_chk: 'e37c55a5:"id" < 50000',
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

	test<ContextWithRandomHash>("#localSchemaCamelCase", () => {
		const bookStatus = enumType("book_status", [
			"available",
			"checked_out",
			"lost",
		]);
		const books = table({
			columns: {
				id: serial(),
				name: varchar(),
				location: varchar(),
				status: enumerated(bookStatus),
			},
			indexes: [index(["name"])],
			constraints: {
				unique: [unique(["name", "location"])],
			},
		});
		const firstCheck = check(sql`${sql.ref("bookId")} > 50`);
		const secondCheck = check(sql`${sql.ref("bookId")} < 50000`);
		const userStatus = enumType("user_status", ["active", "inactive"]);
		const users = table({
			columns: {
				id: serial(),
				name: varchar().notNull(),
				fullName: varchar(),
				email: varchar().notNull(),
				bookId: integer(),
				status: enumerated(userStatus),
			},
			constraints: {
				primaryKey: primaryKey(["fullName"]),
				foreignKeys: [foreignKey(["bookId"], books, ["id"])],
				unique: [
					unique(["name"]),
					unique(["fullName"]),
					unique(["email"]).nullsNotDistinct(),
				],
				checks: [firstCheck, secondCheck],
			},
			indexes: [index(["fullName"])],
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("statement")
					.function("foo"),
			},
		});

		const database = pgDatabase({
			extensions: [extension("cube"), extension("btree_gin")],
			types: [bookStatus, userStatus],
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
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
						dataType: "character varying",
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
			checkConstraints: {
				users: {
					f685097b_kinetic_chk: 'f685097b:"book_id" < 50000',
					fa9b3b3f_kinetic_chk: 'fa9b3b3f:"book_id" > 50',
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
});

test("trigger names are downcased", () => {
	const users = table({
		columns: {
			id: serial(),
		},
		triggers: {
			foo_Before_update: trigger()
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
		checkConstraints: {},
		enums: {},
	};
	expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
		expectedLocalSchema,
	);
});

test("#localSchemaCamelCase", () => {
	const bookStatus = enumType("book_status", [
		"available",
		"checked_out",
		"lost",
	]);
	const books = table({
		columns: {
			id: serial(),
			name: varchar(),
			location: varchar(),
			status: enumerated(bookStatus),
		},
		indexes: [index(["name"])],
		constraints: {
			unique: [unique(["name", "location"])],
		},
	});

	const userStatus = enumType("user_status", ["active", "inactive"]);
	const users = table({
		columns: {
			id: serial(),
			name: varchar().notNull(),
			fullName: varchar(),
			email: varchar().notNull(),
			bookId: integer(),
			status: enumerated(userStatus),
		},
		constraints: {
			primaryKey: primaryKey(["fullName"]),
			foreignKeys: [foreignKey(["bookId"], books, ["id"])],
			unique: [
				unique(["name"]),
				unique(["fullName"]),
				unique(["email"]).nullsNotDistinct(),
			],
		},
		indexes: [index(["fullName"])],
		triggers: {
			foo_before_update: trigger()
				.fireWhen("before")
				.events(["update"])
				.forEach("statement")
				.function("foo"),
		},
	});

	const database = pgDatabase({
		extensions: [extension("cube"), extension("btree_gin")],
		types: [bookStatus, userStatus],
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
					dataType: "character varying",
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
					dataType: "character varying",
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
					dataType: "character varying",
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
					dataType: "character varying",
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
					dataType: "character varying",
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
					dataType: "character varying",
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
					dataType: "character varying",
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
		checkConstraints: {},
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

describe("#localSchema with external objects", () => {
	test("discard primary and foreign keys", () => {
		const books = table({
			columns: {
				id: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]).external(),
			},
		});

		const authors = table({
			columns: {
				name: varchar().notNull(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["book_id"], books, ["id"]).external()],
			},
		});
		const database = pgDatabase({
			tables: {
				books,
				authors,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					id: {
						characterMaximumLength: null,
						columnName: "id",
						dataType: "integer",
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
				},
				authors: {
					book_id: {
						characterMaximumLength: null,
						columnName: "book_id",
						dataType: "integer",
						datetimePrecision: null,
						defaultValue: null,
						enum: false,
						identity: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						renameFrom: null,
						tableName: "authors",
					},
					name: {
						characterMaximumLength: null,
						columnName: "name",
						dataType: "character varying",
						datetimePrecision: null,
						defaultValue: null,
						enum: false,
						identity: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						renameFrom: null,
						tableName: "authors",
					},
				},
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard indexes", () => {
		const books = table({
			columns: {
				id: integer().notNull(),
			},
			indexes: [index(["id"]).external()],
		});
		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					id: {
						characterMaximumLength: null,
						columnName: "id",
						dataType: "integer",
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
				},
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard unique constraints", () => {
		const books = table({
			columns: {
				name: integer(),
			},
			constraints: {
				unique: [unique(["name"]).external()],
			},
		});
		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					name: {
						characterMaximumLength: null,
						columnName: "name",
						dataType: "integer",
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard check constraints", () => {
		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("id")} > 50`).external()],
			},
		});
		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					id: {
						characterMaximumLength: null,
						columnName: "id",
						dataType: "integer",
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard triggers", () => {
		const database = pgDatabase({
			tables: {
				users: table({
					columns: {},
					triggers: {
						foo_before_update: trigger()
							.fireWhen("before")
							.events(["update"])
							.forEach("row")
							.function("moddatetime", [{ column: "updatedAt" }])
							.external(),
					},
				}),
			},
		});

		const expectedLocalSchema = {
			table: {
				users: {},
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard enums", () => {
		const userStatus = enumType("user_status", [
			"active",
			"inactive",
		]).external();
		const database = pgDatabase({
			types: [userStatus],
			tables: {},
		});

		const expectedLocalSchema = {
			table: {},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(database, migrationSchemaFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});
});
