import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import {
	boolean,
	integer,
	pgEnum,
	serial,
	varchar,
} from "~/database/schema/pg_column.js";
import { PgIndex, index } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { PgForeignKey, foreignKey } from "./pg_foreign_key.js";
import { PgUnique, unique } from "./pg_unique.js";

describe("pgTable definition", () => {
	test("has a name", () => {
		const tbl = pgTable("users", {
			columns: {
				name: varchar(),
				subscribed: boolean(),
			},
		});
		expect(tbl.name).toBe("users");
	});

	test("has columns defined", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.columns).toBe(columns);
	});

	test("columns with pgEnum", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
			role: pgEnum("role", ["admin", "user"]),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.columns).toBe(columns);
	});

	test("indexes are empty by default", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.indexes).toStrictEqual([]);
	});

	test("indexes can be added", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
			indexes: [
				index("name", (idx) => idx.unique().using("btree")),
				index("subscribed", (idx) => idx.unique().using("btree")),
			],
		});
		expect(tbl.indexes?.length).toBe(2);
		for (const idx of tbl.indexes || []) {
			expect(idx).toBeInstanceOf(PgIndex);
		}
	});

	describe("constraints", () => {
		test("foreign key constraints can be added", () => {
			const books = pgTable("books", {
				columns: {
					id: serial(),
					name: varchar(),
					location: varchar(),
				},
				uniqueConstraints: [unique(["name", "location"])],
			});

			const users = pgTable("users", {
				columns: {
					id: serial(),
					name: varchar(),
					subscribed: boolean(),
					book_id: integer(),
				},
				foreignKeys: [foreignKey(["book_id"], books, ["id"])],
			});
			expect(users.schema.foreignKeys?.length).toBe(1);
			for (const constraint of users.schema.foreignKeys || []) {
				expect(constraint).toBeInstanceOf(PgForeignKey);
			}
		});

		test("unique constraints can be added", () => {
			const columns = {
				id: serial(),
				name: varchar(),
				subscribed: boolean(),
			};

			const tbl = pgTable("users", {
				columns: columns,
				uniqueConstraints: [unique(["name"]), unique(["subscribed"])],
			});
			expect(tbl.schema.uniqueConstraints?.length).toBe(2);
			for (const constraint of tbl.schema.uniqueConstraints || []) {
				expect(constraint).toBeInstanceOf(PgUnique);
			}
		});

		test("primary key", () => {
			const tbl = pgTable("users", {
				columns: {
					id: integer(),
					name: varchar(),
				},
				primaryKey: ["id"],
			});
			expect(tbl.schema.primaryKey).toStrictEqual(["id"]);
		});

		test("primary key with more than one column", () => {
			const tbl = pgTable("users", {
				columns: {
					id: integer(),
					name: varchar(),
				},
				primaryKey: ["id", "name"],
			});
			expect(tbl.schema.primaryKey).toStrictEqual(["id", "name"]);
		});
	});

	describe("column type inference", () => {
		describe("column defaults", () => {
			test("nullable selects", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull().defaultTo(0),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0).notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0).notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0).notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().defaultTo(0).notNull(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer(),
					},
					primaryKey: ["id"],
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().notNull(),
					},
					primaryKey: ["id"],
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
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
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
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
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
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
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
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
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
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					primaryKey: ["id"],
				});

				type expectedType = {
					id?: string | number;
				};

				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					primaryKey: ["id"],
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					primaryKey: ["id"],
				});
				type expectedType = {
					id: number;
				};
				type InferredType = typeof tbl.inferSelect;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					primaryKey: ["id"],
				});
				// biome-ignore lint/complexity/noBannedTypes: <explanation>
				type expectedType = {};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					primaryKey: ["id"],
				});
				// biome-ignore lint/complexity/noBannedTypes: <explanation>
				type expectedType = {};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					primaryKey: ["id"],
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
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
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				// biome-ignore lint/complexity/noBannedTypes: <explanation>
				type expectedType = {};
				type InferredType = typeof tbl.inferInsert;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				// biome-ignore lint/complexity/noBannedTypes: <explanation>
				type expectedType = {};
				type InferredType = typeof tbl.inferUpdate;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				const tbl = pgTable("users", {
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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

				test("non nullable and optional inserts", () => {
					const tbl = pgTable("users", {
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
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
					const tbl = pgTable("users", {
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
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
					const tbl = pgTable("users", {
						columns: {
							role: pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
								"user",
							),
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

			describe("non nullable with default", () => {
				test("non nullable selects", () => {
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
					const tbl = pgTable("users", {
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
});
