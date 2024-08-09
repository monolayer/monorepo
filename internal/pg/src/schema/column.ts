import type { pgColumnWithType } from "~/schema/column/column-with-type.js";
import type { PgBigInt } from "~/schema/column/data-types/bigint.js";
import type { PgBigSerial } from "~/schema/column/data-types/bigserial.js";
import type { PgBoolean } from "~/schema/column/data-types/boolean.js";
import type { PgBytea } from "~/schema/column/data-types/bytea.js";
import type { PgCharacterVarying } from "~/schema/column/data-types/character-varying.js";
import type { PgCharacter } from "~/schema/column/data-types/character.js";
import type { PgDate } from "~/schema/column/data-types/date.js";
import type { PgDoublePrecision } from "~/schema/column/data-types/double-precision.js";
import type { PgEnum } from "~/schema/column/data-types/enumerated.js";
import type { PgInteger } from "~/schema/column/data-types/integer.js";
import type { PgJson } from "~/schema/column/data-types/json.js";
import type { PgJsonB } from "~/schema/column/data-types/jsonb.js";
import type { PgNumeric } from "~/schema/column/data-types/numeric.js";
import type { PgReal } from "~/schema/column/data-types/real.js";
import type { PgSerial } from "~/schema/column/data-types/serial.js";
import type { PgSmallint } from "~/schema/column/data-types/smallint.js";
import type { PgText } from "~/schema/column/data-types/text.js";
import type { PgTimeWithTimeZone } from "~/schema/column/data-types/time-with-time-zone.js";
import type { PgTime } from "~/schema/column/data-types/time.js";
import type { PgTimestampWithTimeZone } from "~/schema/column/data-types/timestamp-with-time-zone.js";
import type { PgTimestamp } from "~/schema/column/data-types/timestamp.js";
import type { PgUuid } from "~/schema/column/data-types/uuid.js";

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
