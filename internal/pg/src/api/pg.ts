/**
 * @module pg
 */

export {
	defineDatabase,
	type MonoLayerPgDatabase,
} from "@monorepo/pg/database.js";
export {
	check,
	unmanagedCheck,
	type PgCheck,
	type PgUnmanagedCheck,
} from "~/schema/check.js";
export {
	columnWithType,
	type pgColumnWithType,
} from "~/schema/column/column-with-type.js";
export { bigint, type PgBigInt } from "~/schema/column/data-types/bigint.js";
export {
	bigserial,
	type PgBigSerial,
} from "~/schema/column/data-types/bigserial.js";
export { boolean, type PgBoolean } from "~/schema/column/data-types/boolean.js";
export { bytea, type PgBytea } from "~/schema/column/data-types/bytea.js";
export {
	characterVarying,
	varchar,
	type PgCharacterVarying,
} from "~/schema/column/data-types/character-varying.js";
export {
	char,
	character,
	type PgCharacter,
} from "~/schema/column/data-types/character.js";
export { date, type PgDate } from "~/schema/column/data-types/date.js";
export {
	doublePrecision,
	type PgDoublePrecision,
} from "~/schema/column/data-types/double-precision.js";
export { enumType, type EnumType } from "~/schema/column/data-types/enum.js";
export { enumerated } from "~/schema/column/data-types/enumerated.js";
export { integer, type PgInteger } from "~/schema/column/data-types/integer.js";
export { json, type PgJson } from "~/schema/column/data-types/json.js";
export { jsonb, type PgJsonB } from "~/schema/column/data-types/jsonb.js";
export { numeric, type PgNumeric } from "~/schema/column/data-types/numeric.js";
export { real, type PgReal } from "~/schema/column/data-types/real.js";
export { serial, type PgSerial } from "~/schema/column/data-types/serial.js";
export {
	smallint,
	type PgSmallint,
} from "~/schema/column/data-types/smallint.js";
export { text, type PgText } from "~/schema/column/data-types/text.js";
export {
	timeWithTimeZone,
	timetz,
	type PgTimeWithTimeZone,
} from "~/schema/column/data-types/time-with-time-zone.js";
export { time, type PgTime } from "~/schema/column/data-types/time.js";
export {
	timestampWithTimeZone,
	timestamptz,
	type PgTimestampWithTimeZone,
} from "~/schema/column/data-types/timestamp-with-time-zone.js";
export {
	timestamp,
	type PgTimestamp,
} from "~/schema/column/data-types/timestamp.js";
export { uuid, type PgUuid } from "~/schema/column/data-types/uuid.js";
export { PgExtension, extension } from "~/schema/extension.js";
export {
	foreignKey,
	unmanagedForeignKey,
	type PgForeignKey,
	type PgUnmanagedForeignKey,
} from "~/schema/foreign-key.js";
export {
	index,
	unmanagedIndex,
	type PgIndex,
	type PgUnmanagedIndex,
} from "~/schema/index.js";
export { primaryKey, type PgPrimaryKey } from "~/schema/primary-key.js";
export { type PgRawConstraint } from "~/schema/raw-constraint.js";
// export { schema, type Schema } from "~/schema/schema.js";
export { xml, type PgXML } from "~/schema/column/data-types/xml.js";
export { table, type PgTable, type TableDefinition } from "~/schema/table.js";
export {
	trigger,
	unmanagedTrigger,
	type PgTrigger,
	type PgUnmanagedTrigger,
	type TriggerEvent,
	type TriggerFiringTime,
	type TriggerOptions,
} from "~/schema/trigger.js";
export { unique, type PgUnique } from "~/schema/unique.js";
