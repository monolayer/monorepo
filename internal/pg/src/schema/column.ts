import type { pgColumnWithType } from "~pg/schema/column/column-with-type.js";
import type { PgBigInt } from "~pg/schema/column/data-types/bigint.js";
import type { PgBigSerial } from "~pg/schema/column/data-types/bigserial.js";
import type { PgBoolean } from "~pg/schema/column/data-types/boolean.js";
import type { PgBytea } from "~pg/schema/column/data-types/bytea.js";
import type { PgCharacterVarying } from "~pg/schema/column/data-types/character-varying.js";
import type { PgCharacter } from "~pg/schema/column/data-types/character.js";
import type { PgDate } from "~pg/schema/column/data-types/date.js";
import type { PgDoublePrecision } from "~pg/schema/column/data-types/double-precision.js";
import type { PgEnum } from "~pg/schema/column/data-types/enumerated.js";
import type { PgInteger } from "~pg/schema/column/data-types/integer.js";
import type { PgJson } from "~pg/schema/column/data-types/json.js";
import type { PgJsonB } from "~pg/schema/column/data-types/jsonb.js";
import type { PgNumeric } from "~pg/schema/column/data-types/numeric.js";
import type { PgReal } from "~pg/schema/column/data-types/real.js";
import type { PgSerial } from "~pg/schema/column/data-types/serial.js";
import type { PgSmallint } from "~pg/schema/column/data-types/smallint.js";
import type { PgText } from "~pg/schema/column/data-types/text.js";
import type { PgTimeWithTimeZone } from "~pg/schema/column/data-types/time-with-time-zone.js";
import type { PgTime } from "~pg/schema/column/data-types/time.js";
import type { PgTimestampWithTimeZone } from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
import type { PgTimestamp } from "~pg/schema/column/data-types/timestamp.js";
import type { PgUuid } from "~pg/schema/column/data-types/uuid.js";

export type TableColumn =
	| PgBigInt
	| PgBigSerial
	| PgBoolean
	| PgBytea
	| PgCharacter
	| PgDate
	| PgDoublePrecision
	| PgSmallint
	| PgInteger
	| PgJson
	| PgJsonB
	| PgNumeric
	| PgReal
	| PgSerial
	| PgText
	| PgTime
	| PgTimeWithTimeZone
	| PgTimestamp
	| PgTimestampWithTimeZone
	| PgUuid
	| PgCharacterVarying
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| pgColumnWithType<any, any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| PgEnum<any>;
export type ColumnRecord = Record<string, TableColumn>;
