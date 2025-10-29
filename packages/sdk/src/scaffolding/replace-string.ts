import { readFileSync, writeFileSync } from "fs";
import path from "path";

export function replaceString(opts: {
	from: string;
	to: string;
	files: string[];
}) {
	for (const file of opts.files) {
		const filePath = path.join(process.cwd(), file);
		try {
			const content = readFileSync(filePath, "utf-8");
			const newContent = content.replace(new RegExp(opts.from, "g"), opts.to);
			writeFileSync(filePath, newContent);
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			console.error((e as any).message);
		}
	}
}

export function replaceStringWithIdendentifier(opts: {
	from: string;
	to: string;
	files: string[];
}) {
	for (const file of opts.files) {
		const filePath = path.join(process.cwd(), file);
		try {
			const content = readFileSync(filePath, "utf-8");
			const newContent = content.replace(
				new RegExp(`"${opts.from}"`, "g"),
				opts.to,
			);
			writeFileSync(filePath, newContent);
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			console.error((e as any).message);
		}
	}
}
