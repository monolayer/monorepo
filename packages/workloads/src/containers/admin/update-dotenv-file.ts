import * as fs from "fs";
import { existsSync, writeFileSync } from "fs";
import { cwd } from "node:process";
import * as path from "path";
import readline from "readline";
import { workloadsConfiguration } from "~workloads/configuration.js";

export interface EnvVar {
	name: string;
	value: string;
}

export async function dotenvFile(mode: "dev" | "test") {
	const configuration = await workloadsConfiguration();
	switch (mode) {
		case "dev":
			return configuration.envFileName?.development ?? ".env";
		case "test":
			return configuration.envFileName?.test ?? ".env.test";
	}
}

export async function updateDotenvFile(
	vars: EnvVar[] = [],
	mode: "dev" | "test",
) {
	const envFileName = await dotenvFile(mode);
	const envFilePath = path.join(cwd(), envFileName);

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
		input: fs.createReadStream(envFileName),
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
