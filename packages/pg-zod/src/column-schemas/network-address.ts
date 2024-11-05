import type {
	AnyPGColumn,
	PgColumn,
	SerialColumn,
} from "@monorepo/pg/schema/column/column.js";
import type { PgCIDR } from "@monorepo/pg/schema/column/data-types/cidr.js";
import type { PgInet } from "@monorepo/pg/schema/column/data-types/inet.js";
import type { PgMacaddr } from "@monorepo/pg/schema/column/data-types/macaddr.js";
import type { PgMacaddr8 } from "@monorepo/pg/schema/column/data-types/macaddr8.js";
import { Address4, Address6 } from "ip-address";
import { z } from "zod";
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

export function inetSchema(column: PgInet) {
	return regexStringSchema(column, ipRegex, "Invalid inet");
}

export function cidrSchema(column: PgCIDR) {
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
	return finishSchema(isNullable, base);
}

export function macaddrSchema(column: PgMacaddr) {
	return regexStringSchema(column, macaddrRegex, "Invalid macaddr");
}

export function macaddr8Schema(column: PgMacaddr8) {
	return regexStringSchema(column, macaddr8Regex, "Invalid macaddr8");
}

export function isInetColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgInet {
	return column.constructor.name === "PgInet";
}

export function isCidrColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgCIDR {
	return column.constructor.name === "PgCIDR";
}

export function isMacaddrColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgMacaddr {
	return column.constructor.name === "PgMacaddr";
}

export function isMacaddr8Column(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgMacaddr8 {
	return column.constructor.name === "PgMacaddr8";
}

function regexStringSchema(
	column: AnyPGColumn,
	regexp: RegExp,
	errorMessage: string,
) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().regex(regexp, errorMessage);
	return finishSchema(isNullable, base);
}

function isValidIpv4Cidr(cidr: string) {
	const ipv4 = new Address4(cidr);
	return ipv4.correctForm() === ipv4.startAddress().correctForm();
}

function isValidIpv6Cidr(cidr: string) {
	const ipv6 = new Address6(cidr);
	return ipv6.correctForm() === ipv6.startAddress().correctForm();
}
