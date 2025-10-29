// ML_PG_KLAMP_DB_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/klamp-db"

import { createReadStream, existsSync, writeFileSync } from "fs";
import ora from "ora";
import path from "path";
import { cwd } from "process";
import readline from "readline";

export async function addEnvVar(name: string, value: string) {
	const spinner = ora();
	spinner.start("Adding environment variable to .env.local");
	await updateDotenvFile([
		{
			name,
			value,
		},
	]);
	spinner.succeed();
}

export async function updateDotenvFile(
	vars: { name: string; value: string }[] = [],
) {
	const envFilePath = path.join(cwd(), ".env.local");

	if (!existsSync(envFilePath)) {
		writeFileSync(
			envFilePath,
			vars
				.map((v) => {
					return `${v.name}="${v.value}"`;
				})
				.join("\n"),
		);
		return;
	}

	const newContent: string[] = [];

	const file = readline.createInterface({
		input: createReadStream(".env.local"),
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
	});
}

export async function dotenvFile() {
	return ".env.local";
}
