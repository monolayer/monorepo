import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";

export function installDevPackage(packageName: string) {
	return Effect.tryPromise(async () => {
		const s = p.spinner();
		s.start(`Installing ${packageName} via npm`);
		try {
			execa("npm", ["install", packageName, "--save-dev"]);
			s.stop(`Installed ${packageName} via npm`);
		} catch (error) {
			s.stop(`Failed to install ${packageName} via npm`, 1);
			throw error;
		}
	});
}
