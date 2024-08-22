import { sql } from "kysely";
import { timestampWithTimeZone } from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
import { trigger } from "~pg/schema/trigger.js";

export const timestampsColumns = {
	createdAt: timestampWithTimeZone()
		.notNull()
		.default(sql`now()`),
	updatedAt: timestampWithTimeZone()
		.notNull()
		.default(sql`now()`),
};

export const timestampsTrigger = trigger({
	fireWhen: "before",
	events: ["update"],
	forEach: "row",
	function: {
		name: "moddatetime",
		args: [sql.ref("updatedAt")],
	},
});

/**
 * Trigger that will update a timestamp column with the current time when a record is UPDATED.
 *
 * **IMPORTANT**
 *
 * Requires `moddatetime` extension to be installed.
 *
 */
export function updateTimestampOnRecordUpdate<T extends string>(columnRef: T) {
	return trigger({
		fireWhen: "before",
		events: ["update"],
		forEach: "row",
		function: {
			name: "moddatetime",
			args: [sql.ref(columnRef)],
		},
	});
}
