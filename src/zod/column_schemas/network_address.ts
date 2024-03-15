import { z } from "zod";
import type { ZodType } from "~/schema/inference.js";
import {
	PgCIDR,
	PgColumn,
	PgGeneratedColumn,
	PgInet,
	PgMacaddr,
	PgMacaddr8,
	type AnyPGColumn,
} from "~/schema/pg_column.js";
import { finishSchema } from "../common.js";
import { columnData } from "../helpers.js";
import { cidrRegex, macaddr8Regex, macaddrRegex } from "../regexes/regex.js";

export function inetSchema<T extends PgInet, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().ip();
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function cidrSchema<T extends PgCIDR, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return regexStringSchema(column, cidrRegex, "Invalid cidr");
}

export function macaddrSchema<T extends PgMacaddr, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return regexStringSchema(column, macaddrRegex, "Invalid macaddr");
}

export function macaddr8Schema<T extends PgMacaddr8, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return regexStringSchema(column, macaddr8Regex, "Invalid macaddr8");
}

export function isInetColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInet {
	return column instanceof PgInet;
}

export function isCidrColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgCIDR {
	return column instanceof PgCIDR;
}

export function isMacaddrColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgMacaddr {
	return column instanceof PgMacaddr;
}

export function isMacaddr8Column(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgMacaddr8 {
	return column instanceof PgMacaddr8;
}

function regexStringSchema<T extends AnyPGColumn, PK extends boolean>(
	column: AnyPGColumn,
	regexp: RegExp,
	errorMessage: string,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().regex(regexp, errorMessage);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}
