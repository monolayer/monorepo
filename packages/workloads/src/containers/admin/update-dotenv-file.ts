import * as fs from "fs";
import { existsSync, writeFileSync } from "fs";
import { cwd } from "node:process";
import ora from "ora";
import * as path from "path";
import readline from "readline";

export interface EnvVar {
	name: string;
	value: string;
}

export function updateDotenvFile(vars: EnvVar[] = []) {
	const spinner = ora();
	const envFilePath = path.join(cwd(), ".env");

	if (!existsSync(envFilePath)) {
		spinner.start("Write .env");
		writeFileSync(
			envFilePath,
			vars
				.map((v) => {
					return `${v.name}="${v.value}"`;
				})
				.join("\n"),
		);
		spinner.succeed();
		return;
	}

	spinner.start("Update .env");

	const newContent: string[] = [];

	const file = readline.createInterface({
		input: fs.createReadStream(".env"),
		output: process.stdout,
		terminal: false,
	});
	const keys = vars.reduce<[string, RegExp, string][]>((acc, val) => {
		acc.push([val.name, new RegExp(`^${val.name}`), val.value]);
		return acc;
	}, []);

	file.on("line", (line) => {
		const idx = keys.findIndex((key) => line.trim().match(key[1]));
		if (idx !== -1) {
			const match = keys.splice(idx, 1)[0]!;
			newContent.push(`${match[0]}="${match[2]}"`);
		} else {
			newContent.push(line);
		}
	});
	file.on("close", () => {
		for (const key of keys) {
			newContent.push(`${key[0]}="${key[2]}"`);
		}
		writeFileSync(envFilePath, newContent.join("\n"));
		spinner.succeed();
	});
}
