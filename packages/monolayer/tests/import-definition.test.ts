/* eslint-disable max-lines */
import { describe, expect, test } from "vitest";
import { columnDefinition } from "~/cli/import/column-definition.js";
import { primaryKeyDefinition } from "~/cli/import/definitions.js";
import {
	columnInfoFactory,
	type ColumnInfoFactoryOptions,
} from "./__setup__/helpers/factories/column-info-factory.js";

function expectCode(
	expectedCode: string,
	expectedImport: string,
	columnInfo: Omit<ColumnInfoFactoryOptions, "columnName">,
) {
	const definition = columnDefinition(
		columnInfoFactory({
			columnName: "testColumn",
			...columnInfo,
		}),
		[],
	);
	expect(definition).toStrictEqual({
		code: expectedCode,
		importName: expectedImport,
	});
}

describe("columns", () => {
	test("bigint", () => {
		expectCode("bigint()", "bigint", { dataType: "bigint" });
		expectCode("bigint().notNull()", "bigint", {
			dataType: "bigint",
			isNullable: false,
		});
		expectCode("bigint().default(sql`'12234433444444455'`)", "bigint", {
			dataType: "bigint",
			defaultValue: "731746a5:'12234433444444455'::bigint",
		});
		expectCode(
			"bigint().notNull().default(sql`'12234433444444455'`)",
			"bigint",
			{
				dataType: "bigint",
				isNullable: false,
				defaultValue: "731746a5:'12234433444444455'::bigint",
			},
		);
		expectCode("bigint().generatedByDefaultAsIdentity()", "bigint", {
			dataType: "bigint",
			identity: "BY DEFAULT",
		});
		expectCode("bigint().notNull().generatedByDefaultAsIdentity()", "bigint", {
			dataType: "bigint",
			isNullable: false,
			identity: "BY DEFAULT",
		});
		expectCode("bigint().generatedAlwaysAsIdentity()", "bigint", {
			dataType: "bigint",
			identity: "ALWAYS",
		});
		expectCode("bigint().notNull().generatedAlwaysAsIdentity()", "bigint", {
			dataType: "bigint",
			isNullable: false,
			identity: "ALWAYS",
		});
	});

	test("bigserial", () => {
		expectCode("bigserial()", "bigserial", {
			dataType: "bigserial",
		});
	});

	test("bit", () => {
		expectCode("bit()", "bit", {
			dataType: "bit",
		});
		expectCode("bit(5)", "bit", {
			dataType: "bit",
			characterMaximumLength: 5,
		});
		expectCode("bit().notNull()", "bit", {
			dataType: "bit",
			isNullable: false,
		});
		expectCode("bit().default(sql`'101'`)", "bit", {
			dataType: "bit",
			defaultValue: "731746a5:'101'::bit",
		});
		expectCode("bit().notNull().default(sql`'101'`)", "bit", {
			dataType: "bit",
			isNullable: false,
			defaultValue: "731746a5:'101'::bit",
		});
	});

	test("bit varying", () => {
		expectCode("bitVarying()", "bitVarying", {
			dataType: "bit varying",
		});
		expectCode("bitVarying(5)", "bitVarying", {
			dataType: "bit varying",
			characterMaximumLength: 5,
		});
		expectCode("bitVarying().notNull()", "bitVarying", {
			dataType: "bit varying",
			isNullable: false,
		});
		expectCode("bitVarying().default(sql`'0101'`)", "bitVarying", {
			dataType: "bit varying",
			defaultValue: "f86fb28d:'0101'::bit varying",
		});
		expectCode("bitVarying().notNull().default(sql`'0101'`)", "bitVarying", {
			dataType: "bit varying",
			isNullable: false,
			defaultValue: "f86fb28d:'0101'::bit varying",
		});
	});

	test("boolean", () => {
		expectCode("boolean()", "boolean", {
			dataType: "boolean",
		});
		expectCode("boolean().notNull()", "boolean", {
			dataType: "boolean",
			isNullable: false,
		});
		expectCode("boolean().default(sql`true`)", "boolean", {
			dataType: "boolean",
			defaultValue: "731746a5:true",
		});
		expectCode("boolean().notNull().default(sql`true`)", "boolean", {
			dataType: "boolean",
			isNullable: false,
			defaultValue: "731746a5:true",
		});
	});

	test("bytea", () => {
		expectCode("bytea()", "bytea", {
			dataType: "bytea",
		});
		expectCode("bytea().notNull()", "bytea", {
			dataType: "bytea",
			isNullable: false,
		});
		expectCode("bytea().default(sql`'\\x68656c6c6f'`)", "bytea", {
			dataType: "bytea",
			defaultValue: "65bd0120:'\\x68656c6c6f'::bytea",
		});
		expectCode("bytea().notNull().default(sql`'\\x68656c6c6f'`)", "bytea", {
			dataType: "bytea",
			isNullable: false,
			defaultValue: "65bd0120:'\\x68656c6c6f'::bytea",
		});
	});

	test("character varying", () => {
		expectCode("characterVarying()", "characterVarying", {
			dataType: "character varying",
		});
		expectCode("characterVarying(5)", "characterVarying", {
			dataType: "character varying",
			characterMaximumLength: 5,
		});
		expectCode("characterVarying().notNull()", "characterVarying", {
			dataType: "character varying",
			isNullable: false,
		});
		expectCode("characterVarying().default(sql`'foo'`)", "characterVarying", {
			dataType: "character varying",
			defaultValue: "2bc67682:'foo'::character varying",
		});
		expectCode(
			"characterVarying().notNull().default(sql`'foo'`)",
			"characterVarying",
			{
				dataType: "character varying",
				isNullable: false,
				defaultValue: "2bc67682:'foo'::character varying",
			},
		);
	});

	test("character", () => {
		expectCode("character()", "character", {
			dataType: "character",
		});
		expectCode("character(5)", "character", {
			dataType: "character",
			characterMaximumLength: 5,
		});
		expectCode("character().notNull()", "character", {
			dataType: "character",
			isNullable: false,
		});
		expectCode("character().default(sql`'foo'`)", "character", {
			dataType: "character",
			defaultValue: "2bc67682:'foo'::character",
		});
		expectCode("character().notNull().default(sql`'foo'`)", "character", {
			dataType: "character",
			isNullable: false,
			defaultValue: "2bc67682:'foo'::character",
		});
	});

	test("cidr", () => {
		expectCode("cidr()", "cidr", {
			dataType: "cidr",
		});
		expectCode("cidr().notNull()", "cidr", {
			dataType: "cidr",
			isNullable: false,
		});
		expectCode("cidr().default(sql`'192.168.100.128/25'`)", "cidr", {
			dataType: "cidr",
			defaultValue: "720ecbec:'192.168.100.128/25'::cidr",
		});
		expectCode("cidr().notNull().default(sql`'192.168.100.128/25'`)", "cidr", {
			dataType: "cidr",
			isNullable: false,
			defaultValue: "720ecbec:'192.168.100.128/25'::cidr",
		});
	});

	test("date", () => {
		expectCode("date()", "date", {
			dataType: "date",
		});
		expectCode("date().notNull()", "date", {
			dataType: "date",
			isNullable: false,
		});
		expectCode("date().default(sql`'1970-01-01'`)", "date", {
			dataType: "date",
			defaultValue: "dd41adb1:'1970-01-01'::date",
		});
		expectCode("date().notNull().default(sql`'1970-01-01'`)", "date", {
			dataType: "date",
			isNullable: false,
			defaultValue: "dd41adb1:'1970-01-01'::date",
		});
	});

	test("double precision", () => {
		expectCode("doublePrecision()", "doublePrecision", {
			dataType: "double precision",
		});
		expectCode("doublePrecision().notNull()", "doublePrecision", {
			dataType: "double precision",
			isNullable: false,
		});
		expectCode("doublePrecision().default(sql`'10'`)", "doublePrecision", {
			dataType: "double precision",
			defaultValue: "c4e1ae94:'10'::double precision",
		});
		expectCode(
			"doublePrecision().notNull().default(sql`'10'`)",
			"doublePrecision",
			{
				dataType: "double precision",
				isNullable: false,
				defaultValue: "c4e1ae94:'10'::double precision",
			},
		);
	});

	test("inet", () => {
		expectCode("inet()", "inet", {
			dataType: "inet",
		});
		expectCode("inet().notNull()", "inet", {
			dataType: "inet",
			isNullable: false,
		});
		expectCode("inet().default(sql`'192.168.0.1'`)", "inet", {
			dataType: "inet",
			defaultValue: "840df336:'192.168.0.1'::inet",
		});
		expectCode("inet().notNull().default(sql`'192.168.0.1'`)", "inet", {
			dataType: "inet",
			isNullable: false,
			defaultValue: "840df336:'192.168.0.1'::inet",
		});
	});

	test("integer", () => {
		expectCode("integer()", "integer", {
			dataType: "integer",
		});
		expectCode("integer().notNull()", "integer", {
			dataType: "integer",
			isNullable: false,
		});
		expectCode("integer().default(sql`10`)", "integer", {
			dataType: "integer",
			defaultValue: "4a44dc15:10",
		});
		expectCode("integer().notNull().default(sql`10`)", "integer", {
			dataType: "integer",
			isNullable: false,
			defaultValue: "4a44dc15:10",
		});
		expectCode("integer().generatedByDefaultAsIdentity()", "integer", {
			dataType: "integer",
			identity: "BY DEFAULT",
		});
		expectCode(
			"integer().notNull().generatedByDefaultAsIdentity()",
			"integer",
			{
				dataType: "integer",
				isNullable: false,
				identity: "BY DEFAULT",
			},
		);
		expectCode("integer().generatedAlwaysAsIdentity()", "integer", {
			dataType: "integer",
			identity: "ALWAYS",
		});
		expectCode("integer().notNull().generatedAlwaysAsIdentity()", "integer", {
			dataType: "integer",
			isNullable: false,
			identity: "ALWAYS",
		});
	});

	test("json", () => {
		expectCode("json()", "json", {
			dataType: "json",
		});
		expectCode("json().notNull()", "json", {
			dataType: "json",
			isNullable: false,
		});
		expectCode('json().default(sql`\'{"foo":"bar"}\'`)', "json", {
			dataType: "json",
			defaultValue: 'e18d3ea6:\'{"foo":"bar"}\'::json',
		});
		expectCode('json().notNull().default(sql`\'{"foo":"bar"}\'`)', "json", {
			dataType: "json",
			isNullable: false,
			defaultValue: 'e18d3ea6:\'{"foo":"bar"}\'::json',
		});
	});

	test("jsonb", () => {
		expectCode("jsonb()", "jsonb", {
			dataType: "jsonb",
		});
		expectCode("jsonb().notNull()", "jsonb", {
			dataType: "jsonb",
			isNullable: false,
		});
		expectCode('jsonb().default(sql`\'{"foo":"bar"}\'`)', "jsonb", {
			dataType: "jsonb",
			defaultValue: 'e18d3ea6:\'{"foo":"bar"}\'::json',
		});
		expectCode('jsonb().notNull().default(sql`\'{"foo":"bar"}\'`)', "jsonb", {
			dataType: "jsonb",
			isNullable: false,
			defaultValue: 'e18d3ea6:\'{"foo":"bar"}\'::json',
		});
	});

	test("macaddr", () => {
		expectCode("macaddr()", "macaddr", {
			dataType: "macaddr",
		});
		expectCode("macaddr().notNull()", "macaddr", {
			dataType: "macaddr",
			isNullable: false,
		});
		expectCode("macaddr().default(sql`'08:00:2b:01:02:03'`)", "macaddr", {
			dataType: "macaddr",
			defaultValue: "c14cc2c9:'08:00:2b:01:02:03'::macaddr",
		});
		expectCode(
			"macaddr().notNull().default(sql`'08:00:2b:01:02:03'`)",
			"macaddr",
			{
				dataType: "macaddr",
				isNullable: false,
				defaultValue: "c14cc2c9:'08:00:2b:01:02:03'::macaddr",
			},
		);
	});

	test("macaddr8", () => {
		expectCode("macaddr8()", "macaddr8", {
			dataType: "macaddr8",
		});
		expectCode("macaddr8().notNull()", "macaddr8", {
			dataType: "macaddr8",
			isNullable: false,
		});
		expectCode(
			"macaddr8().default(sql`'08:00:2b:01:02:03:04:05'`)",
			"macaddr8",
			{
				dataType: "macaddr8",
				defaultValue: "d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			},
		);
		expectCode(
			"macaddr8().notNull().default(sql`'08:00:2b:01:02:03:04:05'`)",
			"macaddr8",
			{
				dataType: "macaddr8",
				isNullable: false,
				defaultValue: "d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			},
		);
	});

	test("numeric", () => {
		expectCode("numeric()", "numeric", {
			dataType: "numeric",
		});
		expectCode("numeric(5, 2)", "numeric", {
			dataType: "numeric",
			numericPrecision: 5,
			numericScale: 2,
		});
		expectCode("numeric().notNull()", "numeric", {
			dataType: "numeric",
			isNullable: false,
		});
		expectCode("numeric().default(sql`'1.1'`)", "numeric", {
			dataType: "numeric",
			defaultValue: "d8bd8ef0:'1.1'::numeric",
		});
		expectCode("numeric().notNull().default(sql`'1.1'`)", "numeric", {
			dataType: "numeric",
			isNullable: false,
			defaultValue: "d8bd8ef0:'1.1'::numeric",
		});
	});

	test("real", () => {
		expectCode("real()", "real", {
			dataType: "real",
		});
		expectCode("real().notNull()", "real", {
			dataType: "real",
			isNullable: false,
		});
		expectCode("real().default(sql`'100'`)", "real", {
			dataType: "real",
			defaultValue: "df0c433b:'100'::real",
		});
		expectCode("real().notNull().default(sql`'100'`)", "real", {
			dataType: "real",
			isNullable: false,
			defaultValue: "df0c433b:'100'::real",
		});
	});

	test("serial", () => {
		expectCode("serial()", "serial", {
			dataType: "serial",
		});
	});

	test("smallint", () => {
		expectCode("smallint()", "smallint", {
			dataType: "smallint",
		});
		expectCode("smallint().notNull()", "smallint", {
			dataType: "smallint",
			isNullable: false,
		});
		expectCode("smallint().default(sql`'10'`)", "smallint", {
			dataType: "smallint",
			defaultValue: "235f517d:'10'::smallint",
		});
		expectCode("smallint().notNull().default(sql`'10'`)", "smallint", {
			dataType: "smallint",
			isNullable: false,
			defaultValue: "235f517d:'10'::smallint",
		});
		expectCode("smallint().generatedByDefaultAsIdentity()", "smallint", {
			dataType: "smallint",
			identity: "BY DEFAULT",
		});
		expectCode(
			"smallint().notNull().generatedByDefaultAsIdentity()",
			"smallint",
			{
				dataType: "smallint",
				isNullable: false,
				identity: "BY DEFAULT",
			},
		);
		expectCode("smallint().generatedAlwaysAsIdentity()", "smallint", {
			dataType: "smallint",
			identity: "ALWAYS",
		});
		expectCode("smallint().notNull().generatedAlwaysAsIdentity()", "smallint", {
			dataType: "smallint",
			isNullable: false,
			identity: "ALWAYS",
		});
	});

	test("text", () => {
		expectCode("text()", "text", {
			dataType: "text",
		});
		expectCode("text().notNull()", "text", {
			dataType: "text",
			isNullable: false,
		});
		expectCode("text().default('foo')", "text", {
			dataType: "text",
			defaultValue: "ae72411e:'foo'::text",
		});
		expectCode("text().notNull().default('foo')", "text", {
			dataType: "text",
			isNullable: false,
			defaultValue: "ae72411e:'foo'::text",
		});
	});

	test("time", () => {
		expectCode("time()", "time", {
			dataType: "time",
		});
		expectCode("time(5)", "time", {
			dataType: "time",
			datetimePrecision: 5,
		});
		expectCode("time().notNull()", "time", {
			dataType: "time",
			isNullable: false,
		});
		expectCode("time().default(sql`'04:05 AM'`)", "time", {
			dataType: "time",
			defaultValue: "48a39507:'04:05 AM'::time without time zone",
		});
		expectCode("time().notNull().default(sql`'04:05 AM'`)", "time", {
			dataType: "time",
			isNullable: false,
			defaultValue: "48a39507:'04:05 AM'::time without time zone",
		});
	});

	test("time with time zone", () => {
		expectCode("timeWithTimeZone()", "timeWithTimeZone", {
			dataType: "time with time zone",
		});
		expectCode("timeWithTimeZone(5)", "timeWithTimeZone", {
			dataType: "time with time zone",
			datetimePrecision: 5,
		});
		expectCode("timeWithTimeZone().notNull()", "timeWithTimeZone", {
			dataType: "time with time zone",
			isNullable: false,
		});
		expectCode(
			"timeWithTimeZone().default(sql`'04:05:06-08:00'`)",
			"timeWithTimeZone",
			{
				dataType: "time with time zone",
				defaultValue: "12621bc0:'04:05:06-08:00'::time with time zone",
			},
		);
		expectCode(
			"timeWithTimeZone().notNull().default(sql`'04:05:06-08:00'`)",
			"timeWithTimeZone",
			{
				dataType: "time with time zone",
				isNullable: false,
				defaultValue: "12621bc0:'04:05:06-08:00'::time with time zone",
			},
		);
	});

	test("timestamp", () => {
		expectCode("timestamp()", "timestamp", {
			dataType: "timestamp",
		});
		expectCode("timestamp(5)", "timestamp", {
			dataType: "timestamp",
			datetimePrecision: 5,
		});
		expectCode("timestamp().notNull()", "timestamp", {
			dataType: "timestamp",
			isNullable: false,
		});
		expectCode(
			"timestamp().default(sql`'1970-01-01T00:00:00.001Z'`)",
			"timestamp",
			{
				dataType: "timestamp",
				defaultValue:
					"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			},
		);
		expectCode(
			"timestamp().notNull().default(sql`'1970-01-01T00:00:00.001Z'`)",
			"timestamp",
			{
				dataType: "timestamp",
				isNullable: false,
				defaultValue:
					"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			},
		);
	});

	test("timestamp with time zone", () => {
		expectCode("timestampWithTimeZone()", "timestampWithTimeZone", {
			dataType: "timestamp with time zone",
		});
		expectCode("timestampWithTimeZone(5)", "timestampWithTimeZone", {
			dataType: "timestamp with time zone",
			datetimePrecision: 5,
		});
		expectCode("timestampWithTimeZone().notNull()", "timestampWithTimeZone", {
			dataType: "timestamp with time zone",
			isNullable: false,
		});
		expectCode(
			"timestampWithTimeZone().default(sql`'1970-01-01T00:00:00.001Z'`)",
			"timestampWithTimeZone",
			{
				dataType: "timestamp with time zone",
				defaultValue:
					"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			},
		);
		expectCode(
			"timestampWithTimeZone().notNull().default(sql`'1970-01-01T00:00:00.001Z'`)",
			"timestampWithTimeZone",
			{
				dataType: "timestamp with time zone",
				isNullable: false,
				defaultValue:
					"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			},
		);
	});

	test("tsquery", () => {
		expectCode("tsquery()", "tsquery", {
			dataType: "tsquery",
		});
		expectCode("tsquery().notNull()", "tsquery", {
			dataType: "tsquery",
			isNullable: false,
		});
		expectCode("tsquery().default(sql`'foo'`)", "tsquery", {
			dataType: "tsquery",
			defaultValue: "8dfffe81:'foo'::tsvector",
		});
		expectCode("tsquery().notNull().default(sql`'foo'`)", "tsquery", {
			dataType: "tsquery",
			isNullable: false,
			defaultValue: "8dfffe81:'foo'::tsvector",
		});
	});

	test("tsvector", () => {
		expectCode("tsvector()", "tsvector", {
			dataType: "tsvector",
		});
		expectCode("tsvector().notNull()", "tsvector", {
			dataType: "tsvector",
			isNullable: false,
		});
		expectCode("tsvector().default(sql`'foo'`)", "tsvector", {
			dataType: "tsvector",
			defaultValue: "8dfffe81:'foo'::tsvector",
		});
		expectCode("tsvector().notNull().default(sql`'foo'`)", "tsvector", {
			dataType: "tsvector",
			isNullable: false,
			defaultValue: "8dfffe81:'foo'::tsvector",
		});
	});

	test("uuid", () => {
		expectCode("uuid()", "uuid", {
			dataType: "uuid",
		});
		expectCode("uuid().notNull()", "uuid", {
			dataType: "uuid",
			isNullable: false,
		});
		expectCode(
			"uuid().default(sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`)",
			"uuid",
			{
				dataType: "uuid",
				defaultValue: "70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			},
		);
		expectCode(
			"uuid().notNull().default(sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`)",
			"uuid",
			{
				dataType: "uuid",
				isNullable: false,
				defaultValue: "70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			},
		);
	});

	test("xml", () => {
		expectCode("xml()", "xml", {
			dataType: "xml",
		});
		expectCode("xml().notNull()", "xml", {
			dataType: "xml",
			isNullable: false,
		});
		expectCode(
			"xml().default(sql`'<?xml version=\"1.0\"?><book><title>Manual</title></book>'`)",
			"xml",
			{
				dataType: "xml",
				defaultValue:
					"a0c8e47f:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'::xml",
			},
		);
		expectCode(
			"xml().notNull().default(sql`'<?xml version=\"1.0\"?><book><title>Manual</title></book>'`)",
			"xml",
			{
				dataType: "xml",
				isNullable: false,
				defaultValue:
					"a0c8e47f:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'::xml",
			},
		);
	});

	test("generic column", () => {
		expectCode('columnWithType("integer[]")', "columnWithType", {
			dataType: "integer[]",
		});
		expectCode('columnWithType("integer[]").notNull()', "columnWithType", {
			dataType: "integer[]",
			isNullable: false,
		});
		expectCode(
			"columnWithType(\"money\").default(sql`'12.34'::float8::numeric::money`)",
			"columnWithType",
			{
				dataType: "money",
				defaultValue: "f86fb28d:'12.34'::float8::numeric::money",
			},
		);
		expectCode(
			"columnWithType(\"money\").notNull().default(sql`'12.34'::float8::numeric::money`)",
			"columnWithType",
			{
				dataType: "money",
				isNullable: false,
				defaultValue: "f86fb28d:'12.34'::float8::numeric::money",
			},
		);
	});
});

describe("primary keys", () => {
	test("primary key", () => {
		expect(primaryKeyDefinition('("id")')).toStrictEqual('primaryKey(["id"])');
		expect(primaryKeyDefinition('("id", "fullName")')).toStrictEqual(
			'primaryKey(["fullName", "id"])',
		);
	});
});
