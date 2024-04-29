import * as p from "@clack/prompts";
import { Effect } from "effect";
import { printChangesetSummary } from "~/changeset/print-changeset-summary.js";
import { computeExtensionChangeset } from "~/database/extension/changeset.js";
import { renderToFile } from "~/migrations/render.js";
import { changeset } from "../changeset/changeset.js";
import { DevEnvironment } from "../services/environment.js";
import { migrationDependency, migrationName } from "./migration.js";

export function generateMigration(name?: string) {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.all([changeset(), computeExtensionChangeset()])
				.pipe(
					Effect.flatMap(([schemaChangeset, extensionChangeset]) =>
						Effect.succeed(extensionChangeset.concat(schemaChangeset)),
					),
				)
				.pipe(
					Effect.tap((changeset) =>
						Effect.if(changeset.length > 0, {
							onTrue: () => Effect.succeed(printChangesetSummary(changeset)),
							onFalse: () => Effect.succeed(true),
						}),
					),
					Effect.tap((changeset) =>
						Effect.if(changeset.length > 0, {
							onTrue: () =>
								Effect.succeed(changeset).pipe(
									Effect.tap((cset) =>
										Effect.if(name !== undefined, {
											onTrue: () => Effect.succeed(name!),
											onFalse: () => migrationName(),
										}).pipe(
											Effect.tap((migrationName) =>
												migrationDependency().pipe(
													Effect.tap((dependency) => {
														renderToFile(
															cset,
															environment.schemaMigrationsFolder,
															migrationName,
															dependency,
														);
													}),
												),
											),
										),
									),
								),
							onFalse: () =>
								Effect.succeed(true).pipe(
									Effect.tap(() => {
										p.log.info(`Nothing to do. No changes detected.`);
									}),
								),
						}),
					),
				),
		),
	);
}
