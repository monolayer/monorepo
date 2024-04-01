import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";
import { isExecaError } from "./execa-error.js";

export function checkPackageInstallation(packageName: string) {
	return Effect.tryPromise(async () => {
		const s = p.spinner();
		s.start(`Checking ${packageName}`);
		try {
			await execa("npm", ["list", packageName]);
			s.stop(`${packageName} already installed.`);
			return {
				packageName: packageName,
				installed: true,
			};
		} catch (error) {
			if (isExecaError(error) && (error.stdout || "").includes("empty")) {
				s.stop(`${packageName} not installed.`);
				return {
					packageName: packageName,
					installed: false,
				};
			}
			s.stop(`Failed to check ${packageName}`, 1);
			throw error;
		}
	});
}
