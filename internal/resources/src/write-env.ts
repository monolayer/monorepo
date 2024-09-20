import { parse, stringify } from "envfile";
import { stat } from "fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "process";

function envVarPath() {
	return path.join(cwd(), ".env.f4");
}

async function pathExists(filePath: string) {
	try {
		await stat(filePath);
	} catch (error: any) {
		if (error.code === "ENOENT") {
			return false;
		}
		throw error;
	}
	return true;
}

async function readEnvVarFile() {
	if (await pathExists(envVarPath())) {
		return readFileSync(envVarPath()).toString();
	} else {
		return "";
	}
}

function writeEnvVarFile(contents: string) {
	return writeFileSync(envVarPath(), contents);
}

export async function updateEnvVar(envVarName: string, content: string) {
	const contents = parse(await readEnvVarFile());
	contents[envVarName] = content;
	writeEnvVarFile(stringify(contents));
}

export async function removeEnvVar(envVarName: string) {
	const contents = parse(await readEnvVarFile());
	delete contents[envVarName];
	writeEnvVarFile(stringify(contents));
}
