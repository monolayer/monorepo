import * as p from "@clack/prompts";
import { Effect } from "effect";
import { printChangesetSummary } from "~/changeset/print-changeset-summary.js";
import { computeExtensionChangeset } from "~/database/extension/changeset.js";
import { createSchemaRevision } from "~/revisions/create-schema-revision.js";
import { changeset } from "../changeset/changeset.js";
import { DevEnvironment } from "../services/environment.js";
import { revisionDependency } from "./revision-dependency.js";
import { revisionName } from "./revision-name.js";

export function generateRevision(name?: string) {
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
											onFalse: () => revisionName(),
										}).pipe(
											Effect.tap((revisionName) =>
												revisionDependency().pipe(
													Effect.tap((dependency) => {
														createSchemaRevision(
															cset,
															environment.schemaRevisionsFolder,
															revisionName,
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
