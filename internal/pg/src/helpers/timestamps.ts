import { sql } from "kysely";
import { timestampWithTimeZone } from "~/schema/column/data-types/timestamp-with-time-zone.js";
import { extension } from "~/schema/extension.js";
import { trigger } from "~/schema/trigger.js";

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
