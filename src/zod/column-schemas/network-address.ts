import { Address4, Address6 } from "ip-address";
import { z } from "zod";
import {
	PgCIDR,
	PgColumn,
	PgGeneratedColumn,
	PgInet,
	PgMacaddr,
	PgMacaddr8,
	type AnyPGColumn,
} from "~/schema/column/column.js";
import type { ZodType } from "~/schema/inference.js";
import { finishSchema } from "../common.js";
import { columnData, customIssue } from "../helpers.js";
import {
	cidrRegex,
	ipRegex,
	macaddr8Regex,
	macaddrRegex,
	v4str,
	v6str,
} from "../regexes/regex.js";

export function inetSchema<T extends PgInet, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return regexStringSchema(column, ipRegex, "Invalid inet");
}

export function cidrSchema<T extends PgCIDR, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z
		.string()
		.regex(cidrRegex, "Invalid cidr")
		.superRefine((val, ctx) => {
			if (val.match(v4str) !== null) {
				if (isValidIpv4Cidr(val) === false) {
					return customIssue(
						ctx,
						"Invalid cidr. Value has bits set to right of mask",
					);
				}
			}
			if (val.match(v6str) !== null) {
				if (isValidIpv6Cidr(val) === false) {
					return customIssue(
						ctx,
						"Invalid cidr. Value has bits set to right of mask",
					);
				}
			}
		});
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
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

function isValidIpv4Cidr(cidr: string) {
	const ipv4 = new Address4(cidr);
	return ipv4.correctForm() === ipv4.startAddress().correctForm();
}

function isValidIpv6Cidr(cidr: string) {
	const ipv6 = new Address6(cidr);
	return ipv6.correctForm() === ipv6.startAddress().correctForm();
}
