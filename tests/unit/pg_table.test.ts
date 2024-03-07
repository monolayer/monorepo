import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import {
	pgBigint,
	pgBoolean,
	pgEnum,
	pgInteger,
	pgSerial,
	pgText,
	pgTimestamptz,
	pgVarchar,
} from "~/database/schema/pg_column.js";
import { PgIndex, pgIndex } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import {
	PgForeignKey,
	pgForeignKey,
} from "../../src/database/schema/pg_foreign_key.js";
import { PgUnique, pgUnique } from "../../src/database/schema/pg_unique.js";

describe("pgTable definition", () => {
	test("has columns defined", () => {
		const columns = {
			name: pgVarchar(),
			subscribed: pgBoolean(),
		};
		const tbl = pgTable({
			columns: columns,
		});
		expect(tbl.schema.columns).toBe(columns);
	});

	test("columns with pgEnum", () => {
		const columns = {
			name: pgVarchar(),
			subscribed: pgBoolean(),
			role: pgEnum("role", ["admin", "user"]),
		};
		const tbl = pgTable({
			columns: columns,
		});
		expect(tbl.schema.columns).toBe(columns);
	});

	test("indexes are empty by default", () => {
		const columns = {
			name: pgVarchar(),
			subscribed: pgBoolean(),
		};
		const tbl = pgTable({
			columns: columns,
		});
		expect(tbl.schema.indexes).toStrictEqual([]);
	});

	test("indexes can be added", () => {
		const columns = {
			name: pgVarchar(),
			subscribed: pgBoolean(),
		};
		const tbl = pgTable({
			columns: columns,
			indexes: [
				pgIndex("name").unique().using("btree"),
				pgIndex("subscribed").unique().using("btree"),
			],
		});
		expect(tbl.schema.indexes?.length).toBe(2);
		for (const idx of tbl.schema.indexes || []) {
			expect(idx).toBeInstanceOf(PgIndex);
		}
	});

	describe("constraints", () => {
		test("foreign key constraints can be added", () => {
			const books = pgTable({
				columns: {
					id: pgSerial(),
					name: pgVarchar(),
					location: pgVarchar(),
				},
				uniqueConstraints: [pgUnique(["name", "location"])],
			});

			const users = pgTable({
				columns: {
					id: pgSerial(),
					name: pgVarchar(),
					subscribed: pgBoolean(),
					book_id: pgInteger(),
				},
				foreignKeys: [pgForeignKey(["book_id"], books, ["id"])],
			});
			expect(users.schema.foreignKeys?.length).toBe(1);
			for (const constraint of users.schema.foreignKeys || []) {
				expect(constraint).toBeInstanceOf(PgForeignKey);
			}
		});

		test("unique constraints can be added", () => {
			const columns = {
				id: pgSerial(),
				name: pgVarchar(),
				subscribed: pgBoolean(),
			};

			const tbl = pgTable({
				columns: columns,
				uniqueConstraints: [pgUnique(["name"]), pgUnique(["subscribed"])],
			});
			expect(tbl.schema.uniqueConstraints?.length).toBe(2);
			for (const constraint of tbl.schema.uniqueConstraints || []) {
				expect(constraint).toBeInstanceOf(PgUnique);
			}
		});
	});

	describe("column type inference", () => {
		describe("column defaults", () => {
			test("nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger(),
					},
				});
				type expectedType = {
					id: number | null;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger(),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger(),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number | null;
						readonly __insert__: string | number | null | undefined;
						readonly __update__: string | number | null;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("non nullable columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull(),
					},
				});
				type expectedType = {
					id: string | number;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("columns with default", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | null | undefined;
						readonly __update__: string | number | null;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("non nullable columns with default", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().defaultTo(0),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().defaultTo(0),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().defaultTo(0),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().defaultTo(0),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("columns with default non nullable", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0).notNull(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0).notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0).notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().defaultTo(0).notNull(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("primary key columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().primaryKey(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().primaryKey(),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().primaryKey(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().primaryKey(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("non nullable primary key columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().primaryKey(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().primaryKey(),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().primaryKey(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().notNull().primaryKey(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (serial) columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (serial) primary key columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial().primaryKey(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial().primaryKey(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial().primaryKey(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgSerial().primaryKey(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (by default as identity) columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (by default as identity) primary key columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity().primaryKey(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity().primaryKey(),
					},
				});

				type expectedType = {
					id?: string | number;
				};

				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity().primaryKey(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedByDefaultAsIdentity().primaryKey(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: string | number | undefined;
						readonly __update__: string | number;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (always as identity) primary key columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity().primaryKey(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity().primaryKey(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/ban-types
				type expectedType = {};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity().primaryKey(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/ban-types
				type expectedType = {};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity().primaryKey(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: never;
						readonly __update__: never;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("generated (always as identity) columns", () => {
			test("non nullable selects", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/ban-types
				type expectedType = {};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/ban-types
				type expectedType = {};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable({
					columns: {
						id: pgInteger().generatedAlwaysAsIdentity(),
					},
				});
				type expectedType = {
					id: {
						readonly __select__: number;
						readonly __insert__: never;
						readonly __update__: never;
					};
				};
				type InferredType = typeof tbl.infer;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});
		});

		describe("enum columns", () => {
			describe("defaults", () => {
				test("nullable selects", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]),
						},
					});
					type expectedType = {
						role: string | null;
					};
					type InferredType = typeof tbl.inferSelect;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional inserts", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]),
						},
					});
					type expectedType = {
						role?: string | null;
					};
					type InferredType = typeof tbl.inferInsert;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional updates", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]),
						},
					});
					type expectedType = {
						role?: string | null;
					};
					type InferredType = typeof tbl.inferUpdate;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: string | null;
							readonly __insert__: string | null | undefined;
							readonly __update__: string | null;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("non nullable", () => {
				test("non nullable selects", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).notNull(),
						},
					});
					type expectedType = {
						role: string;
					};
					type InferredType = typeof tbl.inferSelect;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and required inserts", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).notNull(),
						},
					});
					type expectedType = {
						role: string;
					};
					type InferredType = typeof tbl.inferInsert;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).notNull(),
						},
					});
					type expectedType = {
						role?: string;
					};
					type InferredType = typeof tbl.inferUpdate;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).notNull(),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: string;
							readonly __insert__: string;
							readonly __update__: string;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("with default", () => {
				test("non nullable selects", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
						},
					});
					type expectedType = {
						role: string;
					};
					type InferredType = typeof tbl.inferSelect;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional inserts", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
						},
					});
					type expectedType = {
						role?: string | null;
					};
					type InferredType = typeof tbl.inferInsert;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional updates", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
						},
					});
					type expectedType = {
						role?: string | null;
					};
					type InferredType = typeof tbl.inferUpdate;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: string;
							readonly __insert__: string | null | undefined;
							readonly __update__: string | null;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("non nullable with default", () => {
				test("non nullable selects", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.notNull()
								.defaultTo("user"),
						},
					});
					type expectedType = {
						role: string;
					};
					type InferredType = typeof tbl.inferSelect;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional inserts", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.notNull()
								.defaultTo("user"),
						},
					});
					type expectedType = {
						role?: string;
					};
					type InferredType = typeof tbl.inferInsert;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.notNull()
								.defaultTo("user"),
						},
					});
					type expectedType = {
						role?: string;
					};
					type InferredType = typeof tbl.inferUpdate;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.notNull()
								.defaultTo("user"),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: string;
							readonly __insert__: string | undefined;
							readonly __update__: string;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("with default non nullable", () => {
				test("non nullable selects", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.defaultTo("user")
								.notNull(),
						},
					});
					type expectedType = {
						role: string;
					};
					type InferredType = typeof tbl.inferSelect;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional inserts", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.defaultTo("user")
								.notNull(),
						},
					});
					type expectedType = {
						role?: string;
					};
					type InferredType = typeof tbl.inferInsert;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.defaultTo("user")
								.notNull(),
						},
					});
					type expectedType = {
						role?: string;
					};
					type InferredType = typeof tbl.inferUpdate;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const tbl = pgTable({
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"])
								.defaultTo("user")
								.notNull(),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: string;
							readonly __insert__: string | undefined;
							readonly __update__: string;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});
		});
	});

	describe("zod", () => {
		test("schema types match column constraints and defaults", () => {
			const table = pgTable({
				columns: {
					id: pgBigint(),
					idPk: pgInteger().primaryKey(),
					name: pgVarchar().notNull(),
					createdAt: pgTimestamptz().defaultTo("now()"),
				},
			});

			const tableSchema = table.zodSchema();

			type SchemaType = z.infer<typeof tableSchema>;
			type Expected = {
				name: string;
				idPk: number;
				id?: string | null | undefined;
				createdAt?: Date | null | undefined;
			};
			const isEqualSchema: Expect<Equal<SchemaType, Expected>> = true;
			expect(isEqualSchema).toBe(true);

			type InputSchema = z.input<typeof tableSchema>;
			type ExpectedInput = {
				idPk: string | number;
				name: string;
				id?: string | number | bigint | null | undefined;
				createdAt?: string | Date | null | undefined;
			};
			const isEqualInput: Expect<Equal<InputSchema, ExpectedInput>> = true;
			expect(isEqualInput).toBe(true);

			type OuputSchema = z.output<typeof tableSchema>;
			type ExpectedOutput = {
				idPk: number;
				name: string;
				id?: string | null | undefined;
				createdAt?: Date | null | undefined;
			};
			const isEqualOutput: Expect<Equal<OuputSchema, ExpectedOutput>> = true;
			expect(isEqualOutput).toBe(true);
		});

		test("schema parses successfully with undefined optionals", () => {
			const table = pgTable({
				columns: {
					name: pgText(),
					description: pgText().defaultTo("TDB"),
				},
			});

			const tableSchema = table.zodSchema();
			expect(tableSchema.safeParse({}).success).toBe(true);
			const result = tableSchema.safeParse({
				name: undefined,
				description: undefined,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBeUndefined();
				expect(result.data.description).toBeUndefined();
			}
		});

		test("schema parse with defined constraints", () => {
			const table = pgTable({
				columns: {
					id: pgInteger().notNull(),
					name: pgText().notNull(),
				},
			});

			const tableSchema = table.zodSchema();
			const resultFail = tableSchema.safeParse({});
			expect(resultFail.success).toBe(false);
			if (!resultFail.success) {
				const formattedErrors = resultFail.error.format();
				expect(formattedErrors.id?._errors).toStrictEqual(["Required"]);
				expect(formattedErrors.name?._errors).toStrictEqual(["Required"]);
			}

			const result = tableSchema.safeParse({
				id: 1,
				name: "John",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.id).toBe(1);
				expect(result.data.name).toStrictEqual("John");
			}
		});
	});
});
