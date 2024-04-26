import * as p from "@clack/prompts";
import { Effect } from "effect";
import { printChangesetSummary } from "~/changeset/print-changeset-summary.js";
import { createSchemaRevision } from "~/revisions/create-schema-revision.js";
import { DevEnvironment } from "../services/environment.js";
import { changeset } from "./changeset.js";
import { computeExtensionChangeset } from "./extension-changeset.js";
import { revisionDependency } from "./revision-dependency.js";
import { revisionName } from "./revision-name.js";

export function generateRevision() {
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
							onTrue: Effect.succeed(true).pipe(
								Effect.tap(() => printChangesetSummary(changeset)),
							),
							onFalse: Effect.succeed(true),
						}),
					),
					Effect.tap((changeset) =>
						Effect.if(changeset.length > 0, {
							onTrue: Effect.succeed(changeset).pipe(
								Effect.tap((cset) =>
									revisionName().pipe(
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
							onFalse: Effect.succeed(true).pipe(
								Effect.tap(() => {
									p.log.message(`Nothing to do. No changes detected.`);
								}),
							),
						}),
					),
				),
		),
	);
}
