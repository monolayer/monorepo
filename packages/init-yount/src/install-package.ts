import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";

export function installPackage(options: {
	packageName: string;
	installed: boolean;
}) {
	return Effect.tryPromise(async () => {
		if (options.installed) {
			return;
		}
		const s = p.spinner();
		s.start(`Installing ${options.packageName} via npm`);
		try {
			await execa("npm", ["install", options.packageName]);
			s.stop(`Installed ${options.packageName} via npm`);
		} catch (error) {
			s.stop(`Failed to install ${options.packageName} via npm`, 1);
			throw error;
		}
	});
}

export function installDevPackage(options: {
	packageName: string;
	installed: boolean;
}) {
	return Effect.tryPromise(async () => {
		if (options.installed) {
			return;
		}
		const s = p.spinner();
		s.start(`Installing ${options.packageName} via npm`);
		try {
			await execa("npm", ["install", options.packageName, "--save-dev"]);
			s.stop(`Installed ${options.packageName} via npm`);
		} catch (error) {
			s.stop(`Failed to install ${options.packageName} via npm`, 1);
			throw error;
		}
	});
}
