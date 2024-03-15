import { ipRegex } from "~/zod/regexes/ip_regex.js";

const v4str = `^${ipRegex.v4().source}\\/(3[0-2]|[12]?[0-9])$`;
const v6str = `^${ipRegex.v6().source}\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$`;

export const cidrRegex = new RegExp(`(?:${v4str})|(?:${v6str})`, "g");
