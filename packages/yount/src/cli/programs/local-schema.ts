import * as p from "@clack/prompts";
import { Effect } from "effect";
import { importSchema, type Config } from "~/config.js";
import { ExitWithSuccess } from "../utils/cli-action.js";

export function localDatabaseSchema(config: Config) {
	return Effect.tryPromise(async () => await importSchema()).pipe(
		Effect.flatMap((localSchemaFile) => {
			if (localSchemaFile.database === undefined) {
				p.log.warning(
					`Nothing to do. No database schema exported at ${config.folder}/schema.ts.`,
				);
				return Effect.fail(
					new ExitWithSuccess({
						cause: "No database schema exported found",
					}),
				);
			} else {
				return Effect.succeed(localSchemaFile.database);
			}
		}),
	);
}
