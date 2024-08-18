import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";

export const dbSchema = schema({
	tables: {
		regulus_mint: table({
			columns: {
				name: text().notNull(),
			},
		}),
		regulur_door: table({
			columns: {
				name: text().notNull(),
			},
		}),
		alphard_black: table({
			columns: {
				name: text().notNull(),
			},
		}),
		mirfak_mustart: table({
			columns: {
				name: text().notNull(),
			},
		}),
	},
});
