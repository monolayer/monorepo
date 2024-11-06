/* eslint-disable max-lines */
import {
	type Insertable,
	type Selectable,
	type Simplify,
	type Updateable,
} from "kysely";
import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import { tableInfo } from "~pg/introspection/table.js";
import { columnWithType } from "~pg/schema/column/column-with-type.js";
import { bigint } from "~pg/schema/column/data-types/bigint.js";
import { boolean } from "~pg/schema/column/data-types/boolean.js";
import { varchar } from "~pg/schema/column/data-types/character-varying.js";
import { enumType } from "~pg/schema/column/data-types/enum.js";
import { enumerated } from "~pg/schema/column/data-types/enumerated.js";
import { integer } from "~pg/schema/column/data-types/integer.js";
import { serial } from "~pg/schema/column/data-types/serial.js";
import { text } from "~pg/schema/column/data-types/text.js";
import { foreignKey } from "~pg/schema/foreign-key.js";
import { index } from "~pg/schema/index.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { unique } from "~pg/schema/unique.js";

describe("pgTable definition", () => {
	test("has columns defined", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = table({
			columns: columns,
		});
		expect(tableInfo(tbl).definition.columns).toBe(columns);
	});

	test("columns with pgEnum", () => {
		const role = enumType("role", ["admin", "user"]);
		const columns = {
			name: varchar(),
			subscribed: boolean(),
			role: enumerated(role),
		};
		const tbl = table({
			columns: columns,
		});
		expect(tableInfo(tbl).definition.columns).toBe(columns);
	});

	test("indexes can be added", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = table({
			columns: columns,
			indexes: [
				index(["name"]).unique().using("btree"),
				index(["subscribed"]).unique().using("btree"),
			],
		});
		expect(tableInfo(tbl).definition.indexes?.length).toBe(2);
	});

	describe("constraints", () => {
		test("foreign key constraints can be added", () => {
			const books = table({
				columns: {
					id: serial(),
					name: varchar(),
					location: varchar(),
				},
				constraints: {
					unique: [unique(["name", "location"])],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					name: varchar(),
					subscribed: boolean(),
					book_id: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["book_id"], books, ["name"])],
				},
			});
			expect(tableInfo(users).definition.constraints?.foreignKeys?.length).toBe(
				1,
			);
		});

		test("unique constraints can be added", () => {
			const columns = {
				id: serial(),
				name: varchar(),
				subscribed: boolean(),
			};

			const tbl = table({
				columns: columns,
				constraints: {
					unique: [unique(["name"]), unique(["subscribed"])],
				},
			});
			expect(tableInfo(tbl).definition.constraints?.unique?.length).toBe(2);
		});
	});

	describe("column type inference", () => {
		describe("column defaults", () => {
			test("nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				type expectedType = {
					id: number | null;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = Simplify<Simplify<Insertable<typeof tbl.infer>>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				type expectedType = {
					id: string | number;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
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
			test("nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0),
					},
				});
				type expectedType = {
					id: number | null;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0),
					},
				});
				type expectedType = {
					id?: string | number | null;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0),
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

		describe("non nullable columns with default", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(0),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(0),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(0),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(0),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0).notNull(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0).notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0).notNull(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().default(0).notNull(),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						demo: bigint(),
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["demo", "id"]),
					},
				});
				type expectedType = {
					id: number;
					demo: string;
				};

				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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

		describe("external primary key columns", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						demo: bigint(),
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["demo", "id"]).external(),
					},
				});
				type expectedType = {
					id: number;
					demo: string;
				};

				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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

		describe("non nullable external primary key columns", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and required inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
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

		describe("primary key columns with default", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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

		describe("generated (serial) external primary key columns", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable and optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id?: number | string;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});

				type expectedType = {
					id?: string | number;
				};

				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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

		describe("generated (by default as identity) external primary key columns", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});

				type expectedType = {
					id?: string | number;
				};

				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("non nullable optional updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id?: string | number;
				};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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

		describe("generated (always as identity) external primary key columns", () => {
			test("non nullable selects", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]).external(),
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				type expectedType = {
					id: number;
				};
				type InferredType = Selectable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept inserts", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Simplify<Insertable<typeof tbl.infer>>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("does not accept updates", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-empty-object-type
				type expectedType = {};
				type InferredType = Updateable<typeof tbl.infer>;
				const equal: Expect<Equal<InferredType, expectedType>> = true;
				expect(equal).toBe(true);
			});

			test("infer select, insert, and update", () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const tbl = table({
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
					const role = enumType("role", ["admin", "user"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role),
						},
					});
					type expectedType = {
						role: "admin" | "user" | null;
					};
					type InferredType = Selectable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional inserts", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser" | null;
					};
					type InferredType = Simplify<Insertable<typeof tbl.infer>>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional updates", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser" | null;
					};
					type InferredType = Updateable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: "user" | "admin" | "superuser" | null;
							readonly __insert__:
								| "user"
								| "admin"
								| "superuser"
								| null
								| undefined;
							readonly __update__: "user" | "admin" | "superuser" | null;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("non nullable", () => {
				test("non nullable selects", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull(),
						},
					});
					type expectedType = {
						role: "user" | "admin" | "superuser";
					};
					type InferredType = Selectable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and required inserts", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull(),
						},
					});
					type expectedType = {
						role: "user" | "admin" | "superuser";
					};
					type InferredType = Simplify<Insertable<typeof tbl.infer>>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull(),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser";
					};
					type InferredType = Updateable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull(),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: "user" | "admin" | "superuser";
							readonly __insert__: "user" | "admin" | "superuser";
							readonly __update__: "user" | "admin" | "superuser";
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("with default", () => {
				test("nullable selects", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user"),
						},
					});
					type expectedType = {
						role: "user" | "admin" | "superuser" | null;
					};
					type InferredType = Selectable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional inserts", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user"),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser" | null;
					};
					type InferredType = Simplify<Insertable<typeof tbl.infer>>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("nullable and optional updates", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user"),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser" | null;
					};
					type InferredType = Updateable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user"),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: "user" | "admin" | "superuser" | null;
							readonly __insert__:
								| "user"
								| "admin"
								| "superuser"
								| null
								| undefined;
							readonly __update__: "user" | "admin" | "superuser" | null;
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("non nullable with default", () => {
				test("non nullable selects", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull().default("user"),
						},
					});
					type expectedType = {
						role: "user" | "admin" | "superuser";
					};
					type InferredType = Selectable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional inserts", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull().default("user"),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser";
					};
					type InferredType = Simplify<Insertable<typeof tbl.infer>>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull().default("user"),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser";
					};
					type InferredType = Updateable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).notNull().default("user"),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: "user" | "admin" | "superuser";
							readonly __insert__: "user" | "admin" | "superuser" | undefined;
							readonly __update__: "user" | "admin" | "superuser";
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});

			describe("with default non nullable", () => {
				test("non nullable selects", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user").notNull(),
						},
					});
					type expectedType = {
						role: "user" | "admin" | "superuser";
					};
					type InferredType = Selectable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional inserts", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user").notNull(),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser";
					};
					type InferredType = Simplify<Insertable<typeof tbl.infer>>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("non nullable and optional updates", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user").notNull(),
						},
					});
					type expectedType = {
						role?: "user" | "admin" | "superuser";
					};
					type InferredType = Updateable<typeof tbl.infer>;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});

				test("infer select, insert, and update", () => {
					const role = enumType("role", ["user", "admin", "superuser"]);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const tbl = table({
						columns: {
							role: enumerated(role).default("user").notNull(),
						},
					});
					type expectedType = {
						role: {
							readonly __select__: "user" | "admin" | "superuser";
							readonly __insert__: "user" | "admin" | "superuser" | undefined;
							readonly __update__: "user" | "admin" | "superuser";
						};
					};
					type InferredType = typeof tbl.infer;
					const equal: Expect<Equal<InferredType, expectedType>> = true;
					expect(equal).toBe(true);
				});
			});
		});
	});

	test("table with generic columns", () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const tbl = table({
			columns: {
				id: integer(),
				amount: columnWithType<string, string>("money"),
			},
		});
		type expectedType = {
			id: number | null;
			amount: string | null;
		};
		type InferredType = Selectable<typeof tbl.infer>;
		const equal: Expect<Equal<InferredType, expectedType>> = true;
		expect(equal).toBe(true);
	});

	test("schema name", () => {
		const tbl = table({
			columns: {
				id: integer().notNull(),
				name: text().notNull(),
			},
		});
		const info = tableInfo(tbl);
		expect(info.schemaName).toBeUndefined();
		Object.defineProperty(tbl, "schemaName", {
			value: "public",
		});
		expect(tableInfo(tbl).schemaName).toBe("public");
	});
});
