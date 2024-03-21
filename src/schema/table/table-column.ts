import type { PgBigInt } from "./column/data-types/bigint.js";
import type { PgBigSerial } from "./column/data-types/bigserial.js";
import type { PgBoolean } from "./column/data-types/boolean.js";
import type { PgBytea } from "./column/data-types/bytea.js";
import type { PgCharacterVarying } from "./column/data-types/character-varying.js";
import type { PgCharacter } from "./column/data-types/character.js";
import type { PgDate } from "./column/data-types/date.js";
import type { PgDoublePrecision } from "./column/data-types/double-precision.js";
import type { PgEnum } from "./column/data-types/enumerated.js";
import type { PgInteger } from "./column/data-types/integer.js";
import type { PgJson } from "./column/data-types/json.js";
import type { PgJsonB } from "./column/data-types/jsonb.js";
import type { PgNumeric } from "./column/data-types/numeric.js";
import type { PgReal } from "./column/data-types/real.js";
import type { PgSerial } from "./column/data-types/serial.js";
import type { PgSmallint } from "./column/data-types/smallint.js";
import type { PgText } from "./column/data-types/text.js";
import type { PgTimeWithTimeZone } from "./column/data-types/time-with-time-zone.js";
import type { PgTime } from "./column/data-types/time.js";
import type { PgTimestampWithTimeZone } from "./column/data-types/timestamp-with-time-zone.js";
import type { PgTimestamp } from "./column/data-types/timestamp.js";
import type { PgUuid } from "./column/data-types/uuid.js";

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
	| PgEnum<any>;
export type ColumnRecord = Record<string, TableColumn>;
