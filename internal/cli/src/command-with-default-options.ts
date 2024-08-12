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
			"-d, --database-id <database-id>",
			"Id of an exported database in databases.ts",
			"default",
		)
		.option(
			"-e, --env-file <env-file>" as const,
			"load configuration from .env file" as const,
		);
}
