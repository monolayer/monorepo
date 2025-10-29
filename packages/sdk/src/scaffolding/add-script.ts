import { readFileSync, writeFileSync } from "fs";
import ora from "ora";
import path from "path";
import { cwd } from "process";
import prompts from "prompts";

export async function addScriptToPackageJson(
	name: string,
	scriptValue: string,
) {
	const packageJsonPath = path.join(cwd(), "package.json");
	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

	if (packageJson.scripts && packageJson.scripts[name]) {
		const response = await prompts({
			type: "confirm",
			name: "overwrite",
			message: `Script "${name}" already exists. Overwrite?`,
			initial: false,
		});

		if (!response.overwrite) {
			console.log(`Script "${name}" not overwritten.`);
			return;
		}
	}

	packageJson.scripts = {
		...(packageJson.scripts || {}),
		[name]: scriptValue,
	};

	const spinner = ora();
	spinner.start(`Add script ${name}`);
	writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
	spinner.succeed();
}
