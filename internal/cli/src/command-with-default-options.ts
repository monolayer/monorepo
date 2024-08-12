import type { Command } from "@commander-js/extra-typings";

export function commandWithDefaultOptions({
	name,
	program,
}: {
	name: string;
	program: Command;
}) {
	return program
		.command(name)
		.option(
			"-n, --name <configuration-name>" as const,
			"configuration name as defined in configuration.ts" as const,
			"default" as const,
		)
		.option(
			"-c, --connection <connection-name>" as const,
			"configuration connection name as defined in configuration.ts" as const,
			"development" as const,
		)
		.option(
			"-e, --env-file <env-file>" as const,
			"load configuration from .env file" as const,
		);
}
