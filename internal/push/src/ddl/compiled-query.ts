import indentString from "indent-string";
import { CompiledQuery as KyselyCompiledQuery } from "kysely";
import ora from "ora";
import color from "picocolors";
import { format } from "sql-formatter";

interface Runner {
	compile: () => KyselyCompiledQuery;
	execute: () => Promise<void>;
}

export class CompiledQuery {
	#command: Runner;
	#description: string;

	constructor(command: Runner, description: string) {
		this.#command = command;
		this.#description = description;
	}

	async execute(debug: boolean = true) {
		await this.#executeBuilderWithSpinner({
			runner: this.#command,
			message: this.#description,
			debug,
		});
	}

	async #executeBuilderWithSpinner({
		runner,
		message,
		successMessage,
		debug,
	}: {
		runner: Runner;
		message: string;
		successMessage?: string;
		debug: boolean;
	}) {
		const spinner = ora();
		spinner.start(message);
		const start = performance.now();
		await runner.execute();
		const end = performance.now();
		const milliseconds = Number(end - start).toFixed(3);
		spinner.succeed(
			`${successMessage ?? message} ${color.gray(`${milliseconds}ms`)}`,
		);
		if (debug) {
			const compiled = `${color.gray(this.#formatSQL(runner, 2))}`;
			console.log(`\n${compiled}\n`);
		}
	}

	#formatSQL(builder: Runner, indent?: number) {
		return indentString(
			format(builder.compile().sql, {
				language: "postgresql",
				keywordCase: "upper",
			}),
			indent ?? 0,
		);
	}
}
