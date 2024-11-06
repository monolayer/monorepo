/* eslint-disable max-lines */
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { beforeEach, describe, expect, test } from "vitest";
import {
	columnWithType,
	pgColumnWithType,
} from "~pg/schema/column/column-with-type.js";
import {
	PgColumn,
	SerialColumn,
	type PgColumnBase,
} from "~pg/schema/column/column.js";
import { bigint, PgBigInt } from "~pg/schema/column/data-types/bigint.js";
import {
	bigserial,
	PgBigSerial,
} from "~pg/schema/column/data-types/bigserial.js";
import {
	bitVarying,
	PgBitVarying,
	varbit,
} from "~pg/schema/column/data-types/bit-varying.js";
import { bit, PgBit } from "~pg/schema/column/data-types/bit.js";
import { boolean, PgBoolean } from "~pg/schema/column/data-types/boolean.js";
import { bytea, PgBytea } from "~pg/schema/column/data-types/bytea.js";
import {
	characterVarying,
	PgCharacterVarying,
	varchar,
} from "~pg/schema/column/data-types/character-varying.js";
import {
	char,
	character,
	PgCharacter,
} from "~pg/schema/column/data-types/character.js";
import { cidr, PgCIDR } from "~pg/schema/column/data-types/cidr.js";
import { date, PgDate } from "~pg/schema/column/data-types/date.js";
import {
	doublePrecision,
	PgDoublePrecision,
} from "~pg/schema/column/data-types/double-precision.js";
import { enumType } from "~pg/schema/column/data-types/enum.js";
import { enumerated, PgEnum } from "~pg/schema/column/data-types/enumerated.js";
import { inet, PgInet } from "~pg/schema/column/data-types/inet.js";
import { integer, PgInteger } from "~pg/schema/column/data-types/integer.js";
import { json, PgJson } from "~pg/schema/column/data-types/json.js";
import { jsonb, PgJsonB } from "~pg/schema/column/data-types/jsonb.js";
import { macaddr, PgMacaddr } from "~pg/schema/column/data-types/macaddr.js";
import { macaddr8, PgMacaddr8 } from "~pg/schema/column/data-types/macaddr8.js";
import { numeric, PgNumeric } from "~pg/schema/column/data-types/numeric.js";
import { PgReal, real } from "~pg/schema/column/data-types/real.js";
import { PgSerial, serial } from "~pg/schema/column/data-types/serial.js";
import { PgSmallint, smallint } from "~pg/schema/column/data-types/smallint.js";
import { PgText, text } from "~pg/schema/column/data-types/text.js";
import {
	PgTimeWithTimeZone,
	timetz,
	timeWithTimeZone,
} from "~pg/schema/column/data-types/time-with-time-zone.js";
import { PgTime, time } from "~pg/schema/column/data-types/time.js";
import {
	PgTimestampWithTimeZone,
	timestamptz,
	timestampWithTimeZone,
} from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
import {
	PgTimestamp,
	timestamp,
} from "~pg/schema/column/data-types/timestamp.js";
import { PgTsquery, tsquery } from "~pg/schema/column/data-types/tsquery.js";
import { PgTsvector, tsvector } from "~pg/schema/column/data-types/tsvector.js";
import { PgUuid, uuid } from "~pg/schema/column/data-types/uuid.js";
import { PgXML, xml } from "~pg/schema/column/data-types/xml.js";
import type { ColumnInfo } from "~pg/schema/column/types.js";

type ColumnContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	column: PgColumnBase<any, any, any>;
	columnInfo: ColumnInfo;
};

type ColumnWithoutDefaultContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	column: SerialColumn<any, any>;
	columnInfo: ColumnInfo;
};

describe("PgGeneratedColumn", () => {
	beforeEach((context: ColumnWithoutDefaultContext) => {
		class TestSerial extends SerialColumn<string, number | string> {
			constructor() {
				super("serial", "integer");
			}
		}
		context.column = new TestSerial();
		context.columnInfo = Object.fromEntries(
			Object.entries(context.column),
		).info;
	});

	testBase("serial");

	test("does not have default", (context: ColumnWithoutDefaultContext) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(typeof (context.column as any).default === "function").toBe(false);
	});

	test("does not have notNull", (context: ColumnWithoutDefaultContext) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(typeof (context.column as any).notNull === "function").toBe(false);
	});

	test("does not have generatedAlwaysAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typeof (context.column as any).generatedAlwaysAsIdentity === "function",
		).toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typeof (context.column as any).generatedByDefaultAsIdentity ===
				"function",
		).toBe(false);
	});
});

describe("PgIdentifiableColumn", () => {
	test("generatedAlwaysAsIdentity sets identity to ALWAYS", () => {
		const column = integer();
		column.generatedAlwaysAsIdentity();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.identity).toBe("ALWAYS");
	});

	test("generatedByDefaultAsIdentity sets identity to BY DEFAULT", () => {
		const column = integer();
		column.generatedByDefaultAsIdentity();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.identity).toBe("BY DEFAULT");
	});
});

function testBase(expectedDataType = "integer") {
	testColumnDefaults(expectedDataType);
}

describe("boolean", () => {
	test("returns a PgBoolean instance", () => {
		const column = boolean();
		expect(column).toBeInstanceOf(PgBoolean);
	});

	describe("PgBoolean", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(boolean()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to boolean", () => {
			const info = Object.fromEntries(Object.entries(boolean())).info;
			expect(info.dataType).toBe("boolean");
		});

		test("default with column data type", () => {
			const column = boolean();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(true);
			expect(info.defaultValue).toBe("b5bea41b:true");

			column.default(false);
			expect(info.defaultValue).toBe("fcbcf165:false");

			column.default("true");
			expect(info.defaultValue).toBe("b5bea41b:true");

			column.default("false");
			expect(info.defaultValue).toBe("fcbcf165:false");

			column.default("yes");
			expect(info.defaultValue).toBe("8a798890:yes");

			column.default("no");
			expect(info.defaultValue).toBe("9390298f:no");

			column.default("on");
			expect(info.defaultValue).toBe("b8d31e85:on");

			column.default("off");
			expect(info.defaultValue).toBe("b4dc66dd:off");

			column.default("1");
			expect(info.defaultValue).toBe("6b86b273:1");

			column.default("0");
			expect(info.defaultValue).toBe("5feceb66:0");

			column.default(1);
			expect(info.defaultValue).toBe("6b86b273:1");

			column.default(0);
			expect(info.defaultValue).toBe("5feceb66:0");

			const expression = sql`true`;
			column.default(expression);
			expect(info.defaultValue).toBe("b5bea41b:true");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = boolean() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = boolean() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("text", () => {
	test("returns a PgText instance", () => {
		const column = text();
		expect(column).toBeInstanceOf(PgText);
	});

	describe("PgText", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(text()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to text", () => {
			const info = Object.fromEntries(Object.entries(text())).info;
			expect(info.dataType).toBe("text");
		});

		test("default with column data type", () => {
			const column = text();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("ae72411e:'foo'::text");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = text() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = text() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("bigint", () => {
	test("returns a PgBigInt instance", () => {
		const column = bigint();
		expect(column).toBeInstanceOf(PgBigInt);
	});

	describe("PgBigInt", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(bigint()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bigint", () => {
			const info = Object.fromEntries(Object.entries(bigint())).info;
			expect(info.dataType).toBe("bigint");
		});

		test("default with column data type", () => {
			const column = bigint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(12234433444444455n);
			expect(info.defaultValue).toBe("731746a5:'12234433444444455'::bigint");

			column.default(12);
			expect(info.defaultValue).toBe("0f70dd7f:'12'::bigint");

			column.default("12");
			expect(info.defaultValue).toBe("0f70dd7f:'12'::bigint");
		});

		test("has generatedAlwaysAsIdentity", () => {
			const column = bigint();
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			const column = bigint();
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});
});

describe("bigserial", () => {
	test("returns a PgBigSerial instance", () => {
		const column = bigserial();
		expect(column).toBeInstanceOf(PgBigSerial);
	});

	describe("PgBigSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(bigserial()).toBeInstanceOf(SerialColumn);
		});

		test("dataType is set to bigserial", () => {
			const info = Object.fromEntries(Object.entries(bigserial())).info;
			expect(info.dataType).toBe("bigserial");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bigserial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bigserial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("bytea", () => {
	test("returns a PgBytea instance", () => {
		const column = bytea();
		expect(column).toBeInstanceOf(PgBytea);
	});

	describe("PgBytea", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(bytea()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bytea", () => {
			const info = Object.fromEntries(Object.entries(bytea())).info;
			expect(info.dataType).toBe("bytea");
		});

		test("default with column data type", () => {
			const column = bytea();
			const info = Object.fromEntries(Object.entries(column)).info;

			const buffer = Buffer.from("hello");
			column.default(buffer);
			expect(info.defaultValue).toBe("65bd0120:'\\x68656c6c6f'::bytea");

			column.default("12");
			expect(info.defaultValue).toBe("f35f708d:'\\x3132'::bytea");

			const expression = sql`\\x7b2261223a312c2262223a327d'::bytea`;
			column.default(expression);
			expect(info.defaultValue).toBe(
				"4aa78882:\\x7b2261223a312c2262223a327d'::bytea",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bytea() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bytea() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("date", () => {
	test("returns a PgDate instance", () => {
		const column = date();
		expect(column).toBeInstanceOf(PgDate);
	});

	describe("PgDate", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(date()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to date", () => {
			const info = Object.fromEntries(Object.entries(date())).info;
			expect(info.dataType).toBe("date");
		});

		test("default with column data type", () => {
			const column = date();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe("dd41adb1:'1970-01-01'::date");

			column.default(new Date(1).toISOString());
			expect(info.defaultValue).toBe("dd41adb1:'1970-01-01'::date");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = date() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = date() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("doublePrecision", () => {
	test("returns a PgDoublePrecision instance", () => {
		const column = doublePrecision();
		expect(column).toBeInstanceOf(PgDoublePrecision);
	});

	describe("PgDoublePrecision", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(doublePrecision()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to double precision", () => {
			const info = Object.fromEntries(Object.entries(doublePrecision())).info;
			expect(info.dataType).toBe("double precision");
		});

		test("default with column data type", () => {
			const column = doublePrecision();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("c4e1ae94:'10'::double precision");

			column.default("10");
			expect(info.defaultValue).toBe("c4e1ae94:'10'::double precision");

			column.default(102n);
			expect(info.defaultValue).toBe("0ae2ddfa:'102'::double precision");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = doublePrecision() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = doublePrecision() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("smallint", () => {
	test("returns a PgSmallint instance", () => {
		const column = smallint();
		expect(column).toBeInstanceOf(PgSmallint);
	});

	describe("PgSmallint", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(smallint()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to smallint", () => {
			const info = Object.fromEntries(Object.entries(smallint())).info;
			expect(info.dataType).toBe("smallint");
		});

		test("default with column data type", () => {
			const column = smallint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("235f517d:'10'::smallint");

			column.default("10");
			expect(info.defaultValue).toBe("235f517d:'10'::smallint");
		});

		test("has have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = smallint() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = smallint() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});
});

describe("integer", () => {
	test("returns a PgInteger instance", () => {
		const column = integer();
		expect(column).toBeInstanceOf(PgInteger);
	});

	describe("PgInteger", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(integer()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to integer", () => {
			const info = Object.fromEntries(Object.entries(integer())).info;
			expect(info.dataType).toBe("integer");
		});

		test("default with column data type", () => {
			const column = integer();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("4a44dc15:10");

			column.default("10");
			expect(info.defaultValue).toBe("4a44dc15:10");

			const expression = sql`20`;
			column.default(expression);
			expect(info.defaultValue).toBe("f5ca38f7:20");
		});

		test("has generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = integer() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = integer() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});
});

describe("json", () => {
	test("returns a PgJson instance", () => {
		const column = json();
		expect(column).toBeInstanceOf(PgJson);
	});

	describe("PgJson", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(json()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to json", () => {
			const info = Object.fromEntries(Object.entries(json())).info;
			expect(info.dataType).toBe("json");
		});

		test("default with column data type", () => {
			const column = json();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("8db32685:'10'::json");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('b3b793dd:\'{ "foo": "bar" }\'::json');

			column.default({ foo: "bar" });
			expect(info.defaultValue).toBe('e18d3ea6:\'{"foo":"bar"}\'::json');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = json() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = json() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("jsonb", () => {
	test("returns a PgJsonB instance", () => {
		const column = jsonb();
		expect(column).toBeInstanceOf(PgJsonB);
	});

	describe("PgJsonB", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(jsonb()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to jsonb", () => {
			const info = Object.fromEntries(Object.entries(jsonb())).info;
			expect(info.dataType).toBe("jsonb");
		});

		test("default with column data type", () => {
			const column = jsonb();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("fde695d0:'10'::jsonb");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('df3dc0bb:\'{ "foo": "bar" }\'::jsonb');

			column.default({ foo: "bar" });
			expect(info.defaultValue).toBe('8b9f0ea3:\'{"foo":"bar"}\'::jsonb');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = jsonb() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = jsonb() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("real", () => {
	test("returns a PgReal instance", () => {
		const column = real();
		expect(column).toBeInstanceOf(PgReal);
	});

	describe("PgReal", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(real()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to real", () => {
			const info = Object.fromEntries(Object.entries(real())).info;
			expect(info.dataType).toBe("real");
		});

		test("default with column data type", () => {
			const column = real();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("1c848dd0:'10'::real");

			column.default(10);
			expect(info.defaultValue).toBe("1c848dd0:'10'::real");

			column.default(100n);
			expect(info.defaultValue).toBe("df0c433b:'100'::real");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = real() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = real() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("serial", () => {
	test("returns a PgSerial instance", () => {
		const column = serial();
		expect(column).toBeInstanceOf(PgSerial);
	});

	describe("PgSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(serial()).toBeInstanceOf(SerialColumn);
		});

		test("dataType is set to serial", () => {
			const info = Object.fromEntries(Object.entries(serial())).info;
			expect(info.dataType).toBe("serial");
		});

		test("isNullable is false", () => {
			const info = Object.fromEntries(Object.entries(serial())).info;
			expect(info.isNullable).toBe(false);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = serial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = serial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("uuid", () => {
	test("returns a PgUuid instance", () => {
		const column = uuid();
		expect(column).toBeInstanceOf(PgUuid);
	});

	describe("PgUuid", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(uuid()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to uuid", () => {
			const info = Object.fromEntries(Object.entries(uuid())).info;
			expect(info.dataType).toBe("uuid");
		});

		test("default with column data type", () => {
			const column = uuid();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
			expect(info.defaultValue).toBe(
				"70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);

			const expression = sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid`;
			column.default(expression);
			expect(info.defaultValue).toBe(
				"70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = uuid() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = uuid() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("characterVarying", () => {
	test("returns a PgVarChar instance", () => {
		const column = characterVarying();
		expect(column).toBeInstanceOf(PgCharacterVarying);
	});

	test("has varchar as an alias", () => {
		const column = varchar();
		expect(column).toBeInstanceOf(PgCharacterVarying);
	});

	describe("PgVarChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(characterVarying()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to character varying", () => {
			const info = Object.fromEntries(Object.entries(characterVarying())).info;
			expect(info.dataType).toBe("character varying");
		});

		test("default with column data type", () => {
			const column = characterVarying();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("26d70a00:'10'::character varying");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = characterVarying() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = characterVarying() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = characterVarying(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(
				Object.entries(characterVarying(255)),
			).info;
			expect(info.dataType).toBe("character varying(255)");
		});

		test("default with column data type", () => {
			const column = characterVarying(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("26d70a00:'10'::character varying");
		});
	});
});

describe("character", () => {
	test("returns a PgChar instance", () => {
		const column = character();
		expect(column).toBeInstanceOf(PgCharacter);
	});

	test("has char as an alias", () => {
		const column = char();
		expect(column).toBeInstanceOf(PgCharacter);
	});

	describe("PgChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(character()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to character(1)", () => {
			const info = Object.fromEntries(Object.entries(character())).info;
			expect(info.dataType).toBe("character(1)");
		});

		test("characterMaximumLength is set to 1", () => {
			const column = character();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(1);
		});

		test("default with column data type", () => {
			const column = character();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("2adbd9e9:'10'::character");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = character() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = character() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = character(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(character(255))).info;
			expect(info.dataType).toBe("character(255)");
		});

		test("default with column data type", () => {
			const column = character(200);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("2adbd9e9:'10'::character");
		});
	});
});

describe("time", () => {
	test("returns a PgTime instance", () => {
		const column = time();
		expect(column).toBeInstanceOf(PgTime);
	});

	describe("PgTime", () => {
		test("inherits from PgTimeColumn", () => {
			expect(time()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to time", () => {
			const info = Object.fromEntries(Object.entries(time())).info;
			expect(info.dataType).toBe("time");
		});

		test("datetimePrecision is set to null", () => {
			const column = time();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = time();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05 AM");
			expect(info.defaultValue).toBe(
				"48a39507:'04:05 AM'::time without time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = time() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = time() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = time(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(time(1))).info;
			expect(info.dataType).toBe("time(1)");
		});

		test("default with column data type", () => {
			const column = time(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05 AM");
			expect(info.defaultValue).toBe(
				"48a39507:'04:05 AM'::time without time zone",
			);
		});
	});
});

describe("timeWithTimeZone", () => {
	test("returns a PgTimeTz instance", () => {
		const column = timeWithTimeZone();
		expect(column).toBeInstanceOf(PgTimeWithTimeZone);
	});

	test("timetz alias", () => {
		const column = timetz();
		expect(column).toBeInstanceOf(PgTimeWithTimeZone);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgTimeColumn", () => {
			expect(timeWithTimeZone()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timeWithTimeZone", () => {
			const info = Object.fromEntries(Object.entries(timeWithTimeZone())).info;
			expect(info.dataType).toBe("time with time zone");
		});

		test("datetimePrecision is set to null", () => {
			const column = timeWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = timeWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe(
				"12621bc0:'04:05:06-08:00'::time with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timeWithTimeZone() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timeWithTimeZone() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timeWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timeWithTimeZone(1))).info;
			expect(info.dataType).toBe("time(1) with time zone");
		});

		test("default with column data type", () => {
			const column = timeWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe(
				"12621bc0:'04:05:06-08:00'::time with time zone",
			);
		});
	});
});

describe("timestamp", () => {
	test("returns a PgTimestamp instance", () => {
		const column = timestamp();
		expect(column).toBeInstanceOf(PgTimestamp);
	});

	describe("PgTimestamp", () => {
		test("inherits from PgTimeColumn", () => {
			expect(timestamp()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timestamp", () => {
			const info = Object.fromEntries(Object.entries(timestamp())).info;
			expect(info.dataType).toBe("timestamp");
		});

		test("datetimePrecision is set to null", () => {
			const column = timestamp();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = timestamp();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestamp() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestamp() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timestamp(1))).info;
			expect(info.dataType).toBe("timestamp(1)");
		});

		test("default with column data type", () => {
			const column = timestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});
	});
});

describe("timestampWithTimeZone", () => {
	test("returns a PgTimestampTz instance", () => {
		const column = timestampWithTimeZone();
		expect(column).toBeInstanceOf(PgTimestampWithTimeZone);
	});

	test("inherits from PgTimeColumn", () => {
		expect(timestampWithTimeZone()).toBeInstanceOf(PgColumn);
	});

	test("timestamptz alias", () => {
		const column = timestamptz();
		expect(column).toBeInstanceOf(PgTimestampWithTimeZone);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestampWithTimeZone()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timestamptz", () => {
			const info = Object.fromEntries(
				Object.entries(timestampWithTimeZone()),
			).info;
			expect(info.dataType).toBe("timestamp with time zone");
		});

		test("datetimePrecision is set to null", () => {
			const column = timestampWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = timestampWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestampWithTimeZone() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestampWithTimeZone() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timestampWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(
				Object.entries(timestampWithTimeZone(1)),
			).info;
			expect(info.dataType).toBe("timestamp(1) with time zone");
		});

		test("default with column data type", () => {
			const column = timestampWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});
});

describe("numeric", () => {
	test("returns a PgNumeric instance", () => {
		const column = numeric();
		expect(column).toBeInstanceOf(PgNumeric);
	});

	describe("PgNumeric", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(numeric()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to numeric", () => {
			const info = Object.fromEntries(Object.entries(numeric())).info;
			expect(info.dataType).toBe("numeric");
		});

		test("numericPrecision is set to null", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(null);
		});

		test("numericScale is set to null", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(null);
		});

		test("default with column data type", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = numeric() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = numeric() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("numericPrecision is set to precision", () => {
			const column = numeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(4);
		});

		test("numericScale is set to 0", () => {
			const column = numeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(0);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(numeric(5))).info;
			expect(info.dataType).toBe("numeric(5, 0)");
		});

		test("default with column data type", () => {
			const column = numeric(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
		});
	});

	describe("with scale", () => {
		test("numericScale is set to scale", () => {
			const column = numeric(4, 5);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(5);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(numeric(4, 5))).info;
			expect(info.dataType).toBe("numeric(4, 5)");
		});

		test("default with column data type", () => {
			const column = numeric(5, 1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
		});
	});
});

describe("enumerated", () => {
	test("returns a PgEnum instance", () => {
		const role = enumType("role", ["user", "admin", "superuser"]);
		const testEnum = enumerated(role);
		expect(testEnum).toBeInstanceOf(PgEnum);
	});

	test("enum name", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;

		expect(columnInfo.dataType).toBe("myEnum");
	});

	test("enum values", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
		const columnDef = Object.fromEntries(Object.entries(testEnum)) as {
			values: string[];
		};
		expect(columnDef.values).toStrictEqual(["one", "two", "three"]);
	});

	test("default info", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;

		expect(columnInfo).toStrictEqual({
			dataType: "myEnum",
			characterMaximumLength: null,
			datetimePrecision: null,
			defaultValue: null,
			identity: null,
			isNullable: true,
			numericPrecision: null,
			numericScale: null,
			enum: true,
			volatileDefault: "unknown",
		});
	});

	test("does not have generatedAlwaysAsIdentity", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const column = enumerated(role) as any;
		expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const column = enumerated(role) as any;
		expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
			false,
		);
	});

	test("notNull()", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role).notNull();
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.isNullable).toBe(false);
	});

	test("default()", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role).default("one");
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.defaultValue).toBe("611b3196:'one'::myEnum");
	});
});

describe("tsvector", () => {
	test("returns a PgTsvector instance", () => {
		const column = tsvector();
		expect(column).toBeInstanceOf(PgTsvector);
	});

	describe("PgTsvector", () => {
		test("inherits from PgColumn", () => {
			expect(tsvector()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to tsvector", () => {
			const info = Object.fromEntries(Object.entries(tsvector())).info;
			expect(info.dataType).toBe("tsvector");
		});

		test("default with string", () => {
			const column = tsvector();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("8dfffe81:'foo'::tsvector");
		});

		test("default with expression", () => {
			const column = tsvector();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`to_tsvector("foo")`);
			expect(info.defaultValue).toBe('67fea042:to_tsvector("foo")');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsvector() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsvector() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("tsquery", () => {
	test("returns a PgTsquery instance", () => {
		const column = tsquery();
		expect(column).toBeInstanceOf(PgTsquery);
	});

	describe("PgTsquery", () => {
		test("inherits from PgColumn", () => {
			expect(tsquery()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to tsquery", () => {
			const info = Object.fromEntries(Object.entries(tsquery())).info;
			expect(info.dataType).toBe("tsquery");
		});

		test("default with string", () => {
			const column = tsquery();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("21f473ad:'foo'::tsquery");
		});

		test("default with expression", () => {
			const column = tsquery();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`to_tsquery("foo")`);
			expect(info.defaultValue).toBe('4212752c:to_tsquery("foo")');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsquery() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsquery() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("xml", () => {
	test("returns a PgXML instance", () => {
		const column = xml();
		expect(column).toBeInstanceOf(PgXML);
	});

	describe("PgXML", () => {
		test("inherits from PgColumn", () => {
			expect(xml()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to xml", () => {
			const info = Object.fromEntries(Object.entries(xml())).info;
			expect(info.dataType).toBe("xml");
		});

		test("default with string", () => {
			const column = xml().default(
				'<?xml version="1.0"?><book><title>Manual</title></book>',
			);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe(
				"a0c8e47f:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'::xml",
			);
		});

		test("default with expression", () => {
			const column = xml();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(
				sql`'<?xml version="1.0"?><book><title>Manual</title></book>'`,
			);
			expect(info.defaultValue).toBe(
				"ed4277f6:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = xml() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = xml() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("bit", () => {
	test("returns a PgBit instance", () => {
		const column = bit();
		expect(column).toBeInstanceOf(PgBit);
	});

	describe("PgBit", () => {
		test("inherits from PgColumn", () => {
			expect(bit()).toBeInstanceOf(PgColumn);
		});

		test("default dataType is bit", () => {
			const info = Object.fromEntries(Object.entries(bit())).info;
			expect(info.dataType).toBe("bit(1)");
		});

		test("dataType with fixed length", () => {
			const info = Object.fromEntries(Object.entries(bit(10))).info;
			expect(info.dataType).toBe("bit(10)");
		});

		test("can set characterMaximumLength", () => {
			const column = bit(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.characterMaximumLength).toBe(5);
		});

		test("default with string", () => {
			const column = bit().default("0");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("e96fd7d9:'0'::bit");
		});

		test("default with expression", () => {
			const column = bit();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'0101'::bit(4)`);
			expect(info.defaultValue).toBe("bb1177bb:'0101'::bit(4)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bit() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bit() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("bit varying", () => {
	test("returns a PgVarbit instance", () => {
		const column = bitVarying();
		expect(column).toBeInstanceOf(PgBitVarying);
	});

	test("has varbit as alias", () => {
		const column = varbit();
		expect(column).toBeInstanceOf(PgBitVarying);
	});

	describe("PgVarbit", () => {
		test("inherits from PgColumn", () => {
			expect(bitVarying()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bit varying", () => {
			const info = Object.fromEntries(Object.entries(bitVarying())).info;
			expect(info.dataType).toBe("bit varying");
		});

		test("can set characterMaximumLength", () => {
			const column = bitVarying(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.characterMaximumLength).toBe(5);
		});

		test("default with string", () => {
			const column = bitVarying().default("0101");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("f86fb28d:'0101'::bit varying");
		});

		test("default with expression", () => {
			const column = bitVarying(4);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'0101'::varbit(4)`);
			expect(info.defaultValue).toBe("f84a42e2:'0101'::varbit(4)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bitVarying() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bitVarying() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("inet", () => {
	test("returns a PgInet instance", () => {
		const column = inet();
		expect(column).toBeInstanceOf(PgInet);
	});

	describe("PgInet", () => {
		test("inherits from PgColumn", () => {
			expect(inet()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to inet", () => {
			const info = Object.fromEntries(Object.entries(inet())).info;
			expect(info.dataType).toBe("inet");
		});

		test("default with string", () => {
			const column = inet().default("192.168.0.1");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("840df336:'192.168.0.1'::inet");
		});

		test("default with expression", () => {
			const column = inet();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'192.168.0.1'::inet`);
			expect(info.defaultValue).toBe("840df336:'192.168.0.1'::inet");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = inet() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = inet() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("cidr", () => {
	test("returns a PgCIDR instance", () => {
		const column = cidr();
		expect(column).toBeInstanceOf(PgCIDR);
	});

	describe("PgCIDR", () => {
		test("inherits from PgColumn", () => {
			expect(cidr()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to inet", () => {
			const info = Object.fromEntries(Object.entries(cidr())).info;
			expect(info.dataType).toBe("cidr");
		});

		test("default with string", () => {
			const column = cidr().default("192.168.100.128/25");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("720ecbec:'192.168.100.128/25'::cidr");
		});

		test("default with expression", () => {
			const column = cidr();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'192.168.100.128/25'::cidr`);
			expect(info.defaultValue).toBe("720ecbec:'192.168.100.128/25'::cidr");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = cidr() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = cidr() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("macaddr", () => {
	test("returns a PgMacaddr instance", () => {
		const column = macaddr();
		expect(column).toBeInstanceOf(PgMacaddr);
	});

	describe("PgMacaddr", () => {
		test("inherits from PgColumn", () => {
			expect(macaddr()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to macaddr", () => {
			const info = Object.fromEntries(Object.entries(macaddr())).info;
			expect(info.dataType).toBe("macaddr");
		});

		test("default with string", () => {
			const column = macaddr().default("08:00:2b:01:02:03");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("c14cc2c9:'08:00:2b:01:02:03'::macaddr");
		});

		test("default with expression", () => {
			const column = macaddr();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'08:00:2b:01:02:03'::macaddr`);
			expect(info.defaultValue).toBe("c14cc2c9:'08:00:2b:01:02:03'::macaddr");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("macaddr8", () => {
	test("returns a PgMacaddr8 instance", () => {
		const column = macaddr8();
		expect(column).toBeInstanceOf(PgMacaddr8);
	});

	describe("PgMacaddr8", () => {
		test("inherits from PgColumn", () => {
			expect(macaddr8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to macaddr8", () => {
			const info = Object.fromEntries(Object.entries(macaddr8())).info;
			expect(info.dataType).toBe("macaddr8");
		});

		test("default with string", () => {
			const column = macaddr8().default("08:00:2b:01:02:03:04:05");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe(
				"d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			);
		});

		test("default with expression", () => {
			const column = macaddr8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'08:00:2b:01:02:03:04:05'::macaddr8`);
			expect(info.defaultValue).toBe(
				"d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});
});

describe("generic column", () => {
	test("returns a PgGenericColumn instance", () => {
		const column = columnWithType("money");
		expect(column).toBeInstanceOf(pgColumnWithType);
	});

	describe("PgGenericColumn", () => {
		test("inherits from PgColumn", () => {
			expect(columnWithType("money")).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to constructor", () => {
			const info = Object.fromEntries(
				Object.entries(columnWithType("money")),
			).info;
			expect(info.dataType).toBe("money");
		});

		test("default with expression", () => {
			const column = columnWithType("money");
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'12.34'::float8::numeric::money`);
			expect(info.defaultValue).toBe(
				"2523bc04:'12.34'::float8::numeric::money",
			);
			expect(info.volatileDefault).toBe("unknown");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = columnWithType("money") as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = columnWithType("money") as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});

		test("select and insert types are unknown by default", () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const column = columnWithType("money");

			type ExpectedType = pgColumnWithType<unknown, unknown>;
			type ColumnType = typeof column;
			const isEqual: Expect<Equal<ColumnType, ExpectedType>> = true;
			expect(isEqual).toBe(true);
		});

		test("select and insert types can be customized", () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const column = columnWithType<string>("money");

			type ExpectedType = pgColumnWithType<string, string>;
			type ColumnType = typeof column;
			const isEqual: Expect<Equal<ColumnType, ExpectedType>> = true;
			expect(isEqual).toBe(true);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const anotherColumn = columnWithType<number, number>("money");
			const isEqualAnother: Expect<
				Equal<typeof anotherColumn, pgColumnWithType<number, number>>
			> = true;
			expect(isEqualAnother).toBe(true);
		});
	});
});

function testColumnDefaults(expectedDataType: string) {
	describe("default column info", () => {
		test("dataType is set to the provided data type", (context: ColumnContext) => {
			expect(context.columnInfo.dataType).toBe(expectedDataType);
		});

		test("defaultValue is null", (context: ColumnContext) => {
			expect(context.columnInfo.defaultValue).toBe(null);
		});

		test("characterMaximumLength is null", (context: ColumnContext) => {
			expect(context.columnInfo.characterMaximumLength).toBe(null);
		});

		test("characterMaximumLength is null", (context: ColumnContext) => {
			expect(context.columnInfo.characterMaximumLength).toBe(null);
		});

		test("numericPrecision is null", (context: ColumnContext) => {
			expect(context.columnInfo.numericPrecision).toBe(null);
		});

		test("numericScale is null", (context: ColumnContext) => {
			expect(context.columnInfo.numericScale).toBe(null);
		});

		test("datetimePrecision is null", (context: ColumnContext) => {
			expect(context.columnInfo.datetimePrecision).toBe(null);
		});

		test("identity is null", (context: ColumnContext) => {
			expect(context.columnInfo.identity).toBe(null);
		});
	});
}
