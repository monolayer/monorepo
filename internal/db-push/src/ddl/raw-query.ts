import indentString from "indent-string";
import type { RawBuilder } from "kysely";
import ora from "ora";
import color from "picocolors";
import { format } from "sql-formatter";
import type { AnyKysely } from "~db-push/changeset/introspection.js";

export class RawQuery {
	#command: RawBuilder<unknown>;
	#description: string;
	#db: AnyKysely;
	#warnings?: string;

	constructor(
		command: RawBuilder<unknown>,
		description: string,
		db: AnyKysely,
		warnings?: string,
	) {
		this.#command = command;
		this.#description = description;
		this.#db = db;
		this.#warnings = warnings;
	}

	async execute(debug: boolean = true) {
		if (debug) {
			await this.#executeRawBuilderWithSpinner({
				runner: this.#command,
				message: this.#description,
				db: this.#db,
				debug,
			});
		} else {
			await this.#command.execute(this.#db);
		}
		if (this.#warnings) {
			console.log(this.#warnings);
		}
	}

	async #executeRawBuilderWithSpinner({
		runner,
		message,
		successMessage,
		db,
	}: {
		runner: RawBuilder<unknown>;
		message: string;
		successMessage?: string;
		db: AnyKysely;
		debug: boolean;
	}) {
		const spinner = ora();
		spinner.start(message);
		const start = performance.now();
		await runner.execute(db);
		const end = performance.now();
		const milliseconds = Number(end - start).toFixed(3);
		spinner.succeed(
			`${successMessage ?? message} ${color.gray(`${milliseconds}ms`)}`,
		);
		const compiled = `${color.gray(this.#formatRawBuilderSQL(runner, db, 2))}`;
		console.log(`\n${compiled}\n`);
	}

	#formatRawBuilderSQL(
		builder: RawBuilder<unknown>,
		db: AnyKysely,
		indent?: number,
	) {
		return indentString(
			format(builder.compile(db).sql, {
				language: "postgresql",
				keywordCase: "upper",
			}),
			indent ?? 0,
		);
	}
}
