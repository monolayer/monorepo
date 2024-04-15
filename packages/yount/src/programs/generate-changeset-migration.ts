import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { generateMigrationFiles } from "~/migrations/generate.js";
import { DevEnvironment } from "../services/environment.js";
import { changeset } from "./changeset.js";
import { computeExtensionChangeset } from "./extension-changeset.js";

export function generateChangesetMigration() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.all([changeset(), computeExtensionChangeset()])
				.pipe(
					Effect.flatMap(([schema, extensions]) =>
						Effect.succeed(extensions.concat(schema)),
					),
				)
				.pipe(
					Effect.tap((changeset) =>
						Effect.if(changeset.length > 0, {
							onTrue: Effect.succeed(changeset).pipe(
								Effect.tap((cset) => {
									generateMigrationFiles(cset, environment.migrationFolder);
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
