import { mappedCheck } from "@monorepo/pg/schema/check.js";
import { columnWithType } from "@monorepo/pg/schema/column/column-with-type.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { numeric } from "@monorepo/pg/schema/column/data-types/numeric.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { timestampWithTimeZone } from "@monorepo/pg/schema/column/data-types/timestamp-with-time-zone.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { mappedIndex } from "@monorepo/pg/schema/index.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { mappedTrigger } from "@monorepo/pg/schema/trigger.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe.skip("Imported Schema test", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("no changes", async (context) => {
		await schemaDump.execute(context.kysely);

		// const extensions = [extension("moddatetime")];

		const lamba = table({
			columns: {
				id: integer().notNull(),
				updated_at: timestampWithTimeZone().default(sql`now()`),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
			triggers: [
				mappedTrigger(
					"update_timestamp",
					sql`CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.lamba FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')`,
				),
			],
		});

		const products = table({
			columns: {
				name: text(),
				price: numeric(),
				product_no: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["product_no"]),
			},
		});

		const orders = table({
			columns: {
				order_id: integer().notNull(),
				product_no: integer(),
				quantity: integer(),
				update_at: columnWithType("timestamp with time zone[]"),
			},
			constraints: {
				primaryKey: primaryKey(["order_id"]),
				foreignKeys: [
					foreignKey(["product_no"], products, ["product_no"])
						.deleteRule("no action")
						.updateRule("no action")
						.external(),
				],
				unique: [unique(["order_id"]).external()],
				checks: [
					mappedCheck("quantity_check", sql`CHECK ((quantity > 0)) NOT VALID`),
				],
			},
			indexes: [
				mappedIndex(
					"order_id_idx",
					sql`CREATE INDEX order_id_idx ON public.orders USING btree (order_id) WITH (deduplicate_items='true')`,
				),
			],
		});

		schema({
			tables: {
				lamba,
				products,
				orders,
			},
		});
	});

	test<DbContext>("add index", async (context) => {
		await schemaDump.execute(context.kysely);
		expect(true).toBe(true);
		// const extensions = [extension("moddatetime")];

		const lamba = table({
			columns: {
				id: integer().notNull(),
				updated_at: timestampWithTimeZone().default(sql`now()`),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
			triggers: [
				mappedTrigger(
					"update_timestamp",
					sql`CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.lamba FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')`,
				),
			],
		});

		const products = table({
			columns: {
				name: text(),
				price: numeric(),
				product_no: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["product_no"]),
			},
		});

		const orders = table({
			columns: {
				order_id: integer().notNull(),
				product_no: integer(),
				quantity: integer(),
				update_at: columnWithType("timestamp with time zone[]"),
			},
			constraints: {
				primaryKey: primaryKey(["order_id"]),
				foreignKeys: [
					foreignKey(["product_no"], products, ["product_no"])
						.deleteRule("no action")
						.updateRule("no action")
						.external(),
				],
				unique: [unique(["order_id"]).external()],
				checks: [
					mappedCheck("quantity_check", sql`CHECK ((quantity > 0)) NOT VALID`),
				],
			},
			indexes: [
				mappedIndex(
					"order_id_idx",
					sql`CREATE INDEX order_id_idx ON public.orders USING btree (order_id) WITH (deduplicate_items='true')`,
				),
			],
		});

		schema({
			tables: {
				lamba,
				products,
				orders,
			},
		});
	});
});

const schemaDump = sql`
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA public;
COMMENT ON EXTENSION moddatetime IS 'functions for tracking last modification time';
CREATE TABLE public.lamba (
		id integer NOT NULL,
		updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.orders (
		order_id integer NOT NULL,
		product_no integer,
		quantity integer,
		update_at timestamp with time zone[]
);
CREATE TABLE public.products (
		product_no integer NOT NULL,
		name text,
		price numeric
);
ALTER TABLE ONLY public.lamba
		ADD CONSTRAINT lamba_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
		ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
ALTER TABLE ONLY public.products
		ADD CONSTRAINT products_pkey PRIMARY KEY (product_no);
ALTER TABLE public.orders
		ADD CONSTRAINT quantity_check CHECK ((quantity > 0)) NOT VALID;
ALTER TABLE ONLY public.orders
		ADD CONSTRAINT "unique" UNIQUE (order_id);
CREATE INDEX order_id_idx ON public.orders USING btree (order_id) WITH (deduplicate_items='true');
CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.lamba FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');
ALTER TABLE ONLY public.orders
		ADD CONSTRAINT orders_product_no_fkey FOREIGN KEY (product_no) REFERENCES public.products(product_no);
`;
