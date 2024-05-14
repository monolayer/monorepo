import * as p from "@clack/prompts";
import { Effect } from "effect";
import { printChangesetSummary } from "~/changeset/print-changeset-summary.js";
import { MigrationOpPriority, type Changeset } from "~/changeset/types.js";
import { validateUniqueSchemaName } from "~/changeset/validate-unique-schema-name.js";
import { computeExtensionChangeset } from "~/database/extension/changeset.js";
import { schemaDependencies } from "~/introspection/dependencies.js";
import { renderToFile } from "~/migrations/render.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { changeset } from "../changeset/changeset.js";
import { migrationDependency, migrationName } from "./migration.js";

export function generateMigration(name?: string) {
	return appEnvironmentMigrationsFolder.pipe(
		Effect.tap(() => validateUniqueSchemaName()),
		Effect.flatMap((schemaMigrationsFolder) =>
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
					Effect.flatMap((changeset) =>
						sortChangesetsBySchemaPriority(changeset),
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
													Effect.tap((dependency) =>
														renderChangesets(
															cset,
															schemaMigrationsFolder,
															migrationName,
															dependency,
														),
													),
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

function sortChangesetsBySchemaPriority(
	changeset: Changeset[],
	mode: "up" | "down" = "up",
) {
	return Effect.gen(function* () {
		const schemaPriorities = yield* schemaDependencies();
		const schemaOrderIndex = schemaPriorities.reduce(
			(acc, name, index) => {
				acc[name] = index;
				return acc;
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{} as Record<string, any>,
		);
		return changeset.toSorted((a, b) => {
			const indexA =
				schemaOrderIndex[a.schemaName ?? "public"] ?? -changeset.length;
			const indexB =
				schemaOrderIndex[b.schemaName ?? "public"] ?? -changeset.length;
			switch (mode) {
				case "up":
					return indexA - indexB;
				case "down":
					return indexB - indexA;
			}
		});
	});
}

function extractMigrationOps(changesets: Changeset[]) {
	return Effect.gen(function* () {
		const sortForUp = yield* sortChangesetsBySchemaPriority(changesets, "up");

		const up = sortForUp
			.filter(
				(changeset) =>
					changeset.up.length > 0 && (changeset.up[0] || []).length > 0,
			)
			.map((changeset) =>
				changeset.up.map((u) => u.join("\n    .")).join("\n\n  "),
			);

		const sortForDown = yield* sortChangesetsBySchemaPriority(
			reverseChangeset(sortForUp),
			"down",
		);

		const down = sortForDown
			.filter(
				(changeset) =>
					changeset.down.length > 0 && (changeset.down[0] || []).length > 0,
			)
			.map((changeset) =>
				changeset.down.map((d) => d.join("\n    .")).join("\n\n  "),
			);
		return { up, down };
	});
}

function reverseChangeset(changesets: Changeset[]) {
	const itemsToMaintain = changesets.filter(
		(changeset) =>
			changeset.type === "createTable" || changeset.type === "dropTable",
	);

	const itemsToReverse = changesets.filter(
		(changeset) =>
			changeset.type !== "createTable" && changeset.type !== "dropTable",
	);

	const databasePriorities = [
		MigrationOpPriority.CreateSchema,
		MigrationOpPriority.CreateExtension,
		MigrationOpPriority.CreateEnum,
	];

	return [...itemsToMaintain, ...itemsToReverse.reverse()].sort((a, b) => {
		if (
			!databasePriorities.includes(a.priority) &&
			a.tableName === "none" &&
			b.tableName !== "none"
		) {
			return -1;
		}
		return 1 - 1;
	});
}

function renderChangesets(
	changesets: Changeset[],
	schemaMigrationsFolder: string,
	migrationName: string,
	dependency: string,
) {
	return Effect.gen(function* () {
		const isolatedChangesets = isolateChangesets(changesets);
		let previousMigrationName: string = "";
		const multipleMigrations = isolatedChangesets.length > 1;
		for (const [idx, isolatedChangeset] of isolatedChangesets.entries()) {
			const ops = yield* extractMigrationOps(isolatedChangeset);
			const numberedName = multipleMigrations
				? `${migrationName}-${idx + 1}`
				: migrationName;
			previousMigrationName = renderToFile(
				ops,
				schemaMigrationsFolder,
				numberedName,
				previousMigrationName === "" ? dependency : previousMigrationName,
				isolatedChangeset.some((m) => (m.transaction ?? true) === false)
					? false
					: true,
			);
		}
	});
}

function isolateChangesets(changesets: Changeset[]) {
	return changesets.reduce<Changeset[][]>((acc, changeset) => {
		const lastGroup = acc.slice(-1)[0];
		if (lastGroup === undefined) {
			acc.push([changeset]);
			return acc;
		}
		if (changeset.transaction === false) {
			acc.push([changeset]);
			return acc;
		}
		if (lastGroup.some((m) => m.transaction === false)) {
			acc.push([changeset]);
			return acc;
		}
		lastGroup.push(changeset);
		return acc;
	}, []);
}
