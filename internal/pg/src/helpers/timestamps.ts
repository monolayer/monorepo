import { sql } from "kysely";
import { timestampWithTimeZone } from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
import { extension } from "~pg/schema/extension.js";
import { trigger } from "~pg/schema/trigger.js";

export const timestamps = {
	columns: {
		createdAt: timestampWithTimeZone()
			.notNull()
			.default(sql`now()`),
		updatedAt: timestampWithTimeZone()
			.notNull()
			.default(sql`now()`),
	},
	trigger: trigger({
		fireWhen: "before",
		events: ["update"],
		forEach: "row",
		function: {
			name: "moddatetime",
			args: [sql.ref("updatedAt")],
		},
	}),
	extension: extension("moddatetime"),
};
