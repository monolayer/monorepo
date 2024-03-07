import * as p from "@clack/prompts";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { exit } from "node:process";
import pg from "pg";
import color from "picocolors";

export function createDir(path: string): void {
	const overwrite = existsSync(path);
	mkdirSync(path, { recursive: true });
	logCreation(path, overwrite);
}

export function createFile(path: string, content: string, log = true): void {
	const overwrite = existsSync(path);
	writeFileSync(path, content);
	if (log) {
		logCreation(path, overwrite);
	}
}

function logCreation(path: string, overwritten = false): void {
	p.log.info(`${color.green(overwritten ? "overwritten" : "created")} ${path}`);
}

type ErrorResult = {
	error: Error;
	message: string;
	code: 1;
};

type SuccessResult = {
	message: string;
	result: pg.QueryResult | { stdout: string; stderr: string };
	code: 0;
};

export type Result = ErrorResult | SuccessResult;

export async function performSingleCommand({
	name,
	spinnerMsg,
	command,
}:
	| { name: string; spinnerMsg: string; command: () => Promise<Result> }
	| { name: string; spinnerMsg: string; command: () => Result }) {
	p.intro(`${color.bgCyan(color.black(name))}`);
	const s = p.spinner();
	s.start(spinnerMsg);
	const result = await command();
	if ("error" in result) {
		s.stop(
			`${result.error.stack} \n\n${indent(
				JSON.stringify(result.error, null, 4),
			)}`,
			result.code,
		);
	} else {
		s.stop(result.message, result.code);
	}
	p.outro(result.code === 0 ? color.green("Done") : color.red("Fail"));
	exit(result.code);
}

function indent(string: string, indent = "   ") {
	return string.replace(/^/gm, indent);
}
