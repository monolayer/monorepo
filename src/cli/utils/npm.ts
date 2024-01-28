import { execa } from "execa";
import { runCommand } from "../command.js";

export async function npmInstall(pkg: string, cwd?: string) {
	return await runCommand("npm", ["install", pkg], {
		cwd: cwd || process.cwd(),
	});
}

export async function npmList(args: string[], cwd?: string) {
	return await runCommand("npm", ["list", ...args], {
		cwd: cwd || process.cwd(),
	});
}
export function npx(args: string[], cwd?: string) {
	return execa("npx", args, {
		cwd: cwd || process.cwd(),
	});
}
