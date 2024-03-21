import { ipRegex as ipRegexFn } from "./ip-regex.js";

export const bitRegex = /^(0|1)+$/;

const v4strWithOptionalSubnet = `^${ipRegexFn.v4({ exact: false }).source}(\\/(3[0-2]|[12]?[0-9]))?$`;
const v6strExactWithOptionalSubnet = `^${ipRegexFn.v6({ exact: false }).source}(\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9]))?$`;
export const ipRegex = new RegExp(
	`(?:${v4strWithOptionalSubnet})|(?:${v6strExactWithOptionalSubnet})`,
	"g",
);

export const v4str = `^${ipRegexFn.v4().source}\\/(3[0-2]|[12]?[0-9])$`;
export const v6str = `^${ipRegexFn.v6().source}\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$`;

export const cidrRegex = new RegExp(`(?:${v4str})|(?:${v6str})`, "g");

export const macaddrRegex =
	/^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$|^(?:[\da-f]{4}\.){2}[\da-f]{4}$/iu;

export const macaddr8Regex =
	/^(?:[\da-f]{2}:){7}[\da-f]{2}$|^(?:[\da-f]{2}-){7}[\da-f]{2}$|^(?:[\da-f]{4}\.){3}[\da-f]{4}$|^(?:[\da-f]{4}:){3}[\da-f]{4}$/iu;

export const timeRegex =
	/^((?:\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:[+-]\d{1,2}(?::?\d{2})?)?)|(\d{6}(?:[+-]\d{2}(?::?\d{2}){0,2})?))$/;
