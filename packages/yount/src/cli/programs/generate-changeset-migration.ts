import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { generateMigrationFiles } from "~/migrations/generate.js";
import { Environment } from "../services/environment.js";
import { schemaChangeset } from "./schema-changeset.js";

export function generateChangesetMigration() {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			schemaChangeset().pipe(
				Effect.tap((changeset) =>
					Effect.if(changeset.length > 0, {
						onTrue: Effect.succeed(changeset).pipe(
							Effect.tap((cset) => {
								generateMigrationFiles(cset, environment.config.folder);
								p.note(
									"To apply migrations, run 'npx yount migrate'",
									"Next Steps",
								);
							}),
						),
						onFalse: Effect.succeed(true).pipe(
							Effect.tap(() => {
								p.log.info(
									`${color.green("Nothing to do")}. No schema changes found.`,
								);
							}),
						),
					}),
				),
			),
		),
	);
}
