import color from "picocolors";

export function printWarning(opts: {
	header: string;
	details: string[];
	notes: string[];
}) {
	warn(opts.header);
	console.log(opts.details.join("\n"));
	console.log(opts.notes.join("\n"));
}

function warn(message: string) {
	console.log(`${color.bgYellow(color.black(" WARNING "))} ${message}`);
}
