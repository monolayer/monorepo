import { text } from "@clack/prompts";
import { PromptCancelError } from "@monorepo/base/errors.js";
import { kebabCase } from "case-anything";
import { Effect } from "effect";

export function migrationNamePrompt() {
	return Effect.gen(function* () {
		const migrationName = yield* Effect.tryPromise(() => askMigrationName());
		if (typeof migrationName !== "string") {
			return yield* Effect.fail(new PromptCancelError());
		}
		return kebabCase(migrationName);
	});
}

export async function askMigrationName() {
	return await text({
		message: "Enter a name for the schema migration",
		placeholder: "Example: add users table",
		validate(value) {
			if (value.length === 0) return `Description is required`;
		},
	});
}
