import { sql } from "kysely";
import { extension } from "~/database/extension/extension.js";
import { timestampWithTimeZone } from "~/database/schema/table/column/data-types/timestamp-with-time-zone.js";
import { trigger } from "~/database/schema/table/trigger/trigger.js";

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
