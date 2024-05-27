import * as p from "@clack/prompts";
import color from "picocolors";

export function printWarning(opts: {
	header: string;
	details: string[];
	notes: string[];
}) {
	warn(opts.header);
	p.log.message(opts.details.join("\n"));
	p.log.message(opts.notes.join("\n"));
}

function warn(message: string) {
	p.log.warning(`${color.bgYellow(color.black(" WARNING "))} ${message}`);
}
