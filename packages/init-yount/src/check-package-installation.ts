import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";

export function checkPackageInstallation(packageName: string) {
	return Effect.tryPromise(async () => {
		const s = p.spinner();
		s.start(`Checking ${packageName}`);
		try {
			const command = execa("npm", ["list", packageName]);
			if (command.exitCode == 0) {
				s.stop(`${packageName} already installed.`);
				return true;
			} else {
				s.stop(`${packageName} not installed.`);
				return false;
			}
		} catch (error) {
			s.stop(`Failed to check ${packageName}`, 1);
			throw error;
		}
	});
}
