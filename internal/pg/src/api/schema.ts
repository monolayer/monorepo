/**
 * @module schema
 */

export {
	defineDatabase,
	type PgDatabase,
	type PgDatabaseConfig,
} from "~pg/database.js";
export {
	check,
	unmanagedCheck,
	type PgCheck,
	type PgUnmanagedCheck,
} from "~pg/schema/check.js";
export {
	columnWithType,
	type pgColumnWithType,
} from "~pg/schema/column/column-with-type.js";
export { bigint, type PgBigInt } from "~pg/schema/column/data-types/bigint.js";
export {
	bigserial,
	type PgBigSerial,
} from "~pg/schema/column/data-types/bigserial.js";
export {
	boolean,
	type PgBoolean,
} from "~pg/schema/column/data-types/boolean.js";
export { bytea, type PgBytea } from "~pg/schema/column/data-types/bytea.js";
export {
	characterVarying,
	varchar,
	type PgCharacterVarying,
} from "~pg/schema/column/data-types/character-varying.js";
export {
	char,
	character,
	type PgCharacter,
} from "~pg/schema/column/data-types/character.js";
export { date, type PgDate } from "~pg/schema/column/data-types/date.js";
export {
	doublePrecision,
	type PgDoublePrecision,
} from "~pg/schema/column/data-types/double-precision.js";
export { enumType, type EnumType } from "~pg/schema/column/data-types/enum.js";
export { enumerated } from "~pg/schema/column/data-types/enumerated.js";
export {
	integer,
	type PgInteger,
} from "~pg/schema/column/data-types/integer.js";
export { json, type PgJson } from "~pg/schema/column/data-types/json.js";
export { jsonb, type PgJsonB } from "~pg/schema/column/data-types/jsonb.js";
export {
	numeric,
	type PgNumeric,
} from "~pg/schema/column/data-types/numeric.js";
export { real, type PgReal } from "~pg/schema/column/data-types/real.js";
export { serial, type PgSerial } from "~pg/schema/column/data-types/serial.js";
export {
	smallint,
	type PgSmallint,
} from "~pg/schema/column/data-types/smallint.js";
export { text, type PgText } from "~pg/schema/column/data-types/text.js";
export {
	timeWithTimeZone,
	timetz,
	type PgTimeWithTimeZone,
} from "~pg/schema/column/data-types/time-with-time-zone.js";
export { time, type PgTime } from "~pg/schema/column/data-types/time.js";
export {
	timestampWithTimeZone,
	timestamptz,
	type PgTimestampWithTimeZone,
} from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
export {
	timestamp,
	type PgTimestamp,
} from "~pg/schema/column/data-types/timestamp.js";
export { uuid, type PgUuid } from "~pg/schema/column/data-types/uuid.js";
export { xml, type PgXML } from "~pg/schema/column/data-types/xml.js";
export { PgExtension, extension } from "~pg/schema/extension.js";
export {
	foreignKey,
	unmanagedForeignKey,
	type PgForeignKey,
	type PgUnmanagedForeignKey,
} from "~pg/schema/foreign-key.js";
export {
	index,
	unmanagedIndex,
	type PgIndex,
	type PgUnmanagedIndex,
} from "~pg/schema/index.js";
export { primaryKey, type PgPrimaryKey } from "~pg/schema/primary-key.js";
export { type PgRawConstraint } from "~pg/schema/raw-constraint.js";
export { schema, type DatabaseSchema, type Schema } from "~pg/schema/schema.js";
export { table, type PgTable, type TableDefinition } from "~pg/schema/table.js";
export {
	trigger,
	unmanagedTrigger,
	type PgTrigger,
	type PgUnmanagedTrigger,
	type TriggerEvent,
	type TriggerFiringTime,
	type TriggerOptions,
} from "~pg/schema/trigger.js";
export { unique, type PgUnique } from "~pg/schema/unique.js";
