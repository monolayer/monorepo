/* eslint-disable max-lines */
import { sql } from "kysely";
import { describe, expect, test, type Mock } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { bigserial } from "~/database/schema/table/column/data-types/bigserial.js";
import { boolean } from "~/database/schema/table/column/data-types/boolean.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { enumerated } from "~/database/schema/table/column/data-types/enumerated.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { timestamp } from "~/database/schema/table/column/data-types/timestamp.js";
import {
	localColumnInfoByTable,
	schemaColumnInfo,
} from "~/database/schema/table/column/instrospection.js";
import { check } from "~/database/schema/table/constraints/check/check.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { index } from "~/database/schema/table/index/index.js";
import { localIndexInfoByTable } from "~/database/schema/table/index/introspection.js";
import { enumType } from "~/database/schema/types/enum/enum.js";
import { localEnumInfo } from "~/database/schema/types/enum/introspection.js";
import { localSchema } from "~/introspection/introspection.js";
import { columnInfoFactory } from "~tests/__setup__/helpers/factories/column-info-factory.js";
import { schemaMigratonInfoFactory } from "~tests/__setup__/helpers/factories/migration-schema.js";
import { unique } from "../src/database/schema/table/constraints/unique/unique.js";
import { table } from "../src/database/schema/table/table.js";
import { trigger } from "../src/database/schema/table/trigger/trigger.js";

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
			defaultValue: "2bc67682:'foo'::character varying",
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
			defaultValue: "9ff7b5b7:CURRENT_TIMESTAMP",
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
	const dbSchema = schema({ name: "public", tables: {} });
	expect(localColumnInfoByTable(dbSchema, schemaMigratonInfoFactory())).toEqual(
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
	const dbSchema = schema({
		name: "public",
		tables: {
			users,
			teams,
		},
	});
	const expectedDbColumnInfoByTable = {
		users: {
			name: "users",
			columns: {
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
		},
		teams: {
			name: "teams",
			columns: {
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
		},
	};
	expect(localColumnInfoByTable(dbSchema, schemaMigratonInfoFactory())).toEqual(
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
	const dbSchema = schema({
		tables: {
			users,
			teams,
		},
	});
	expect(localIndexInfoByTable(dbSchema)).toStrictEqual({
		teams: {
			f252fc40_yount_idx:
				'f252fc40:create index "f252fc40_yount_idx" on "public"."teams" ("active")',
			"6e20f1ec_yount_idx":
				'6e20f1ec:create index "6e20f1ec_yount_idx" on "public"."teams" ("id")',
		},
		users: {
			"1e44c535_yount_idx":
				'1e44c535:create index "1e44c535_yount_idx" on "public"."users" ("email", "id")',
			"83f9e13d_yount_idx":
				'83f9e13d:create index "83f9e13d_yount_idx" on "public"."users" ("name")',
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

	const dbSchema = schema({
		types: [bookStatus, userStatus],
		tables: { users, books },
	});

	expect(localEnumInfo(dbSchema)).toStrictEqual({
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

		const dbSchema = schema({
			// extensions: [extension("cube"), extension("btree_gin")],
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
					name: "books",
					columns: {
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
				},
				teams: {
					name: "teams",
					columns: {
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
				},
				users: {
					name: "users",
					columns: {
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
			},
			index: {
				books: {
					e9c0a68b_yount_idx:
						'e9c0a68b:create index "e9c0a68b_yount_idx" on "public"."books" ("name")',
				},
				teams: {
					b7aa6cce_yount_idx:
						'b7aa6cce:create index "b7aa6cce_yount_idx" on "public"."teams" ("name")',
				},
			},
			foreignKeyConstraints: {
				users: {
					users_c28cc6e8_yount_fk:
						'"users_c28cc6e8_yount_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
				},
			},
			uniqueConstraints: {
				users: {
					users_email_yount_key:
						'"users_email_yount_key" UNIQUE NULLS NOT DISTINCT ("email")',
					users_name_yount_key:
						'"users_name_yount_key" UNIQUE NULLS DISTINCT ("name")',
				},
				books: {
					books_location_name_yount_key:
						'"books_location_name_yount_key" UNIQUE NULLS DISTINCT ("location", "name")',
				},
			},
			checkConstraints: {
				books: {
					books_918b4271_yount_chk: '918b4271:"id" > 50',
					books_e37c55a5_yount_chk: 'e37c55a5:"id" < 50000',
				},
			},

			primaryKey: {
				teams: {
					teams_yount_pk: '"teams_yount_pk" PRIMARY KEY ("id")',
				},
				users: {
					users_yount_pk: '"users_yount_pk" PRIMARY KEY ("id")',
				},
			},
			triggers: {
				teams: {
					foo_before_insert_trg:
						'4bec28eb:CREATE OR REPLACE TRIGGER foo_before_insert_trg\nBEFORE INSERT ON "public"."teams"\nFOR EACH ROW\nEXECUTE FUNCTION foo',
				},
				users: {
					foo_before_update_trg:
						'a796cccb:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON "public"."users"\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo',
				},
			},
			enums: {
				book_status: "available, checked_out, lost",
				user_status: "active, inactive",
			},
		};
		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
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

		const dbSchema = schema({
			// extensions: [extension("cube"), extension("btree_gin")],
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
					name: "books",
					columns: {
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
				},
				new_books: {
					name: "new_books",
					columns: {
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
				},
				users: {
					name: "users",
					columns: {
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
			},
			index: {
				books: {
					e9c0a68b_yount_idx:
						'e9c0a68b:create index "e9c0a68b_yount_idx" on "public"."books" ("name")',
				},
				new_books: {
					"80adf878_yount_idx":
						'80adf878:create index "80adf878_yount_idx" on "public"."new_books" ("name")',
				},
				users: {
					"1ff7c491_yount_idx":
						'1ff7c491:create index "1ff7c491_yount_idx" on "public"."users" ("full_name")',
				},
			},
			foreignKeyConstraints: {
				users: {
					users_c28cc6e8_yount_fk:
						'"users_c28cc6e8_yount_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
				},
			},
			uniqueConstraints: {
				users: {
					users_email_yount_key:
						'"users_email_yount_key" UNIQUE NULLS NOT DISTINCT ("email")',
					users_name_yount_key:
						'"users_name_yount_key" UNIQUE NULLS DISTINCT ("name")',
					users_full_name_yount_key:
						'"users_full_name_yount_key" UNIQUE NULLS DISTINCT ("full_name")',
				},
				books: {
					books_location_name_yount_key:
						'"books_location_name_yount_key" UNIQUE NULLS DISTINCT ("location", "name")',
				},
				new_books: {
					new_books_location_name_yount_key:
						'"new_books_location_name_yount_key" UNIQUE NULLS DISTINCT ("location", "name")',
				},
			},
			checkConstraints: {
				users: {
					users_f685097b_yount_chk: 'f685097b:"book_id" < 50000',
					users_fa9b3b3f_yount_chk: 'fa9b3b3f:"book_id" > 50',
				},
			},

			primaryKey: {
				users: {
					users_yount_pk: '"users_yount_pk" PRIMARY KEY ("full_name")',
				},
			},
			triggers: {
				users: {
					foo_before_update_trg:
						'a796cccb:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON "public"."users"\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo',
				},
			},
			enums: {
				book_status: "available, checked_out, lost",
				user_status: "active, inactive",
			},
		};
		expect(
			localSchema(dbSchema, schemaMigratonInfoFactory(), {
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

	const dbSchema = schema({
		tables: {
			users,
		},
	});

	const expectedLocalSchema = {
		table: {
			users: {
				name: "users",
				columns: {
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
		},
		triggers: {
			users: {
				foo_before_update_trg:
					'a796cccb:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON "public"."users"\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo',
			},
		},
		// extensions: {},
		foreignKeyConstraints: {},
		index: {},
		primaryKey: {},
		uniqueConstraints: {},
		checkConstraints: {},
		enums: {},
	};
	expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
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

	const dbSchema = schema({
		// extensions: [extension("cube"), extension("btree_gin")],
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
				name: "books",
				columns: {
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
			},
			new_books: {
				name: "new_books",
				columns: {
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
			},
			users: {
				name: "users",
				columns: {
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
		},
		index: {
			books: {
				e9c0a68b_yount_idx:
					'e9c0a68b:create index "e9c0a68b_yount_idx" on "public"."books" ("name")',
			},
			new_books: {
				"80adf878_yount_idx":
					'80adf878:create index "80adf878_yount_idx" on "public"."new_books" ("name")',
			},
			users: {
				"1ff7c491_yount_idx":
					'1ff7c491:create index "1ff7c491_yount_idx" on "public"."users" ("full_name")',
			},
		},
		foreignKeyConstraints: {
			users: {
				users_c28cc6e8_yount_fk:
					'"users_c28cc6e8_yount_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
			},
		},
		uniqueConstraints: {
			users: {
				users_email_yount_key:
					'"users_email_yount_key" UNIQUE NULLS NOT DISTINCT ("email")',
				users_name_yount_key:
					'"users_name_yount_key" UNIQUE NULLS DISTINCT ("name")',
				users_full_name_yount_key:
					'"users_full_name_yount_key" UNIQUE NULLS DISTINCT ("full_name")',
			},
			books: {
				books_location_name_yount_key:
					'"books_location_name_yount_key" UNIQUE NULLS DISTINCT ("location", "name")',
			},
			new_books: {
				new_books_location_name_yount_key:
					'"new_books_location_name_yount_key" UNIQUE NULLS DISTINCT ("location", "name")',
			},
		},
		checkConstraints: {},
		primaryKey: {
			users: {
				users_yount_pk: '"users_yount_pk" PRIMARY KEY ("full_name")',
			},
		},
		triggers: {
			users: {
				foo_before_update_trg:
					'a796cccb:CREATE OR REPLACE TRIGGER foo_before_update_trg\nBEFORE UPDATE ON "public"."users"\nFOR EACH STATEMENT\nEXECUTE FUNCTION foo',
			},
		},
		enums: {
			book_status: "available, checked_out, lost",
			user_status: "active, inactive",
		},
	};
	expect(
		localSchema(dbSchema, schemaMigratonInfoFactory(), {
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
		const dbSchema = schema({
			tables: {
				books,
				authors,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					name: "books",
					columns: {
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
				authors: {
					name: "authors",
					columns: {
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
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
		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					name: "books",
					columns: {
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
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
		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					name: "books",
					columns: {
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
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
		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expectedLocalSchema = {
			table: {
				books: {
					name: "books",
					columns: {
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
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard triggers", () => {
		const dbSchema = schema({
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
				users: { name: "users", columns: {} },
			},
			index: {},
			foreignKeyConstraints: {},
			uniqueConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});

	test("discard enums", () => {
		const userStatus = enumType("user_status", [
			"active",
			"inactive",
		]).external();
		const dbSchema = schema({
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
			// extensions: {},
			triggers: {},
			enums: {},
		};

		expect(localSchema(dbSchema, schemaMigratonInfoFactory())).toStrictEqual(
			expectedLocalSchema,
		);
	});
});
