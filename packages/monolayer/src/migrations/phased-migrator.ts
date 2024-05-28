/* eslint-disable max-lines */
import { Effect, Layer } from "effect";
import { mkdirSync } from "fs";
import {
	FileMigrationProvider,
	Migrator as KyselyMigrator,
	NO_MIGRATIONS,
	type MigrationInfo,
	type MigrationResult,
	type MigrationResultSet,
	type NoMigrations,
} from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { ActionError } from "~/cli/errors.js";
import { DbClients, MonolayerPostgresAdapter } from "~/services/db-clients.js";
import {
	MigrationPlanGroup,
	Migrator,
	MigratorLayerProps,
	MonolayerMigrator,
	isExtendedMigration,
	isolateMigrations,
	type MigratorInterface,
} from "~/services/migrator.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { MigrationOpPriority, type Changeset } from "../changeset/types.js";
import { schemaDependencies } from "../introspection/dependencies.js";
import { type Migration, type MonolayerMigrationInfo } from "./migration.js";
import { renderToFile } from "./render.js";

export class PhasedMigrator implements MigratorInterface {
	constructor(
		protected readonly instance: KyselyMigrator,
		protected readonly folder: string,
	) {}

	get #migrations() {
		return Effect.tryPromise(() => this.instance.getMigrations());
	}

	get pending() {
		return Effect.gen(this, function* () {
			const pendingMigrations = (yield* this.#migrations).filter(
				(m) => m.executedAt === undefined,
			);
			return yield* this.#migrationInfoToMonolayerMigrationInfo(
				pendingMigrations,
			);
		});
	}

	get lastExecuted() {
		return Effect.gen(this, function* () {
			return (
				(yield* this.#migrations).find((m) => m.executedAt !== undefined)
					?.name ?? NO_MIGRATIONS
			);
		});
	}

	#readMigration(name: string) {
		return Effect.gen(this, function* () {
			const migrationPath = path.join(this.folder, `${name}.ts`);
			const migration = yield* Effect.tryPromise(() => import(migrationPath));
			if (!isExtendedMigration(migration)) {
				const errorName = "Undefined migration";
				const errorMessage = `No migration defined migration in ${migrationPath}`;
				return yield* Effect.fail(new ActionError(errorName, errorMessage));
			}
			return migration;
		});
	}

	get executed() {
		return Effect.gen(this, function* () {
			return (yield* this.all).filter((m) => m.executedAt !== undefined);
		});
	}

	get nextDependency() {
		return Effect.gen(this, function* () {
			const migrations = yield* this.all;
			return migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
		});
	}

	get all() {
		return Effect.gen(this, function* () {
			mkdirSync(this.folder, { recursive: true });
			const migrationInfo = yield* this.#migrations;
			return yield* this.#migrationInfoToMonolayerMigrationInfo(migrationInfo);
		});
	}

	get migrateToLatest() {
		return Effect.gen(this, function* () {
			let results: MigrationResultSet[] = [];
			const lastExecutedBeforeMigrate = yield* this.lastExecuted;
			const pendingMigrations = yield* this.pending;
			const plan = this.migrateToLatestPlan(pendingMigrations);

			const executed: MigrationPlanGroup[] = [];

			if (plan.length === 0) {
				return { results: [] };
			}

			for (const migration of plan) {
				const migrationResult = yield* this.migrateTo(migration, "up");
				results = [...results, migrationResult];

				if (migrationResult.error !== undefined) {
					yield* this.#rollbackMigrateToLatest(
						lastExecutedBeforeMigrate,
						executed,
					);
					results = this.#addNotExecutedToResults(
						results,
						migration.up,
						pendingMigrations,
					);
					break;
				}
				executed.push(migration);
			}
			return this.#collectResults(results);
		});
	}

	get rollbackAll() {
		return Effect.gen(this, function* () {
			return yield* Effect.tryPromise(() =>
				this.instance.migrateTo(NO_MIGRATIONS),
			);
		});
	}

	migrateTo(migration: MigrationPlanGroup, direction: "up" | "down") {
		return Effect.gen(this, function* () {
			MonolayerPostgresAdapter.useTransaction = migration.transaction;
			return yield* Effect.tryPromise(() =>
				this.instance.migrateTo(
					direction === "up" ? migration.up : migration.down,
				),
			);
		});
	}

	rollbackPlan(
		migrations: MonolayerMigrationInfo[],
		target: string | NoMigrations,
	) {
		const groups = isolateMigrations(migrations);
		const migrationPlan = this.#plan(groups, "down");

		if (migrationPlan.length === 0) {
			return [];
		}

		if (typeof target !== "string") {
			migrationPlan[migrationPlan.length - 1]!.down = NO_MIGRATIONS;
		}

		return migrationPlan;
	}

	#migrationInfoToMonolayerMigrationInfo(
		migrationInfo: readonly MigrationInfo[],
	) {
		return Effect.gen(this, function* () {
			const monolayerMigrationInfo: MonolayerMigrationInfo[] = [];
			for (const info of migrationInfo) {
				const migration = yield* this.#readMigration(info.name);
				monolayerMigrationInfo.push({
					...info,
					transaction: migration.migration.transaction ?? false,
					scaffold: migration.migration.scaffold,
					dependsOn: migration.migration.dependsOn,
				});
			}
			return monolayerMigrationInfo;
		});
	}

	migrateToLatestPlan(migrations: MonolayerMigrationInfo[]) {
		const groups = isolateMigrations(migrations);
		return this.#plan(groups, "up");
	}

	#rollbackMigrateToLatest(
		firstMigration: string | NoMigrations,
		executed: MigrationPlanGroup[],
	) {
		return Effect.gen(this, function* () {
			const lastIndex = executed.length - 1;
			for (const [index, rollBackMigration] of executed.reverse().entries()) {
				const migraotionName =
					index === lastIndex ? firstMigration : rollBackMigration.down;
				const migration = {
					up: rollBackMigration.up,
					down: migraotionName,
					transaction: rollBackMigration.transaction,
				};
				yield* this.migrateTo(migration, "down");
			}
		});
	}

	#plan(groups: Migration[][], direction: "up" | "down") {
		const plan = groups.flatMap((group) => {
			if (group.length === 0) return [];
			return {
				up: group.slice(-1)[0]!.name ?? "",
				down: group[0]!.name ?? "",
				transaction: group.slice(-1)[0]!.transaction ?? true,
			} as MigrationPlanGroup;
		});
		return direction === "up" ? plan : plan.reverse();
	}

	#collectResults(results: MigrationResultSet[]) {
		return results.reduce<{ error?: unknown; results?: MigrationResult[] }>(
			(acc, resultSet) => {
				if (resultSet.error !== undefined) acc.error = resultSet.error;
				acc.results = [...(acc.results ?? []), ...(resultSet.results ?? [])];
				return acc;
			},
			{},
		);
	}

	#addNotExecutedToResults(
		results: MigrationResultSet[],
		untilMigration: string,
		migrations: readonly MonolayerMigrationInfo[],
	) {
		const idx = migrations.findIndex((m) => m.name === untilMigration);
		const notExecuted = migrations.slice(idx + 1).map((m) => {
			const migrationResult: MigrationResult = {
				migrationName: m.name!,
				direction: "Up",
				status: "NotExecuted",
			};
			return migrationResult;
		});
		const resultSet: MigrationResultSet[] = [
			{
				results: notExecuted,
			},
		];
		return [...results, ...resultSet];
	}

	renderChangesets(changesets: Changeset[], migrationName: string) {
		return Effect.gen(this, function* () {
			const migratorRenderer = new PhasedMigratorRenderer();
			return yield* migratorRenderer.renderChangesets(
				this,
				changesets,
				migrationName,
				this.folder,
			);
		});
	}
}

class PhasedMigratorRenderer {
	constructor() {}

	renderChangesets(
		migrator: PhasedMigrator,
		changesets: Changeset[],
		migrationName: string,
		folder: string,
	) {
		return Effect.gen(function* () {
			const migrations = yield* migrator.all;
			const dependency =
				migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
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
					folder,
					numberedName,
					previousMigrationName === "" ? dependency : previousMigrationName,
					isolatedChangeset.some((m) => (m.transaction ?? true) === false)
						? false
						: true,
				);
			}
		});
	}

	sortChangesetsBySchemaPriority(
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

	extractMigrationOps(changesets: Changeset[]) {
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

	reverseChangeset(changesets: Changeset[]) {
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

	isolateChangesets(changesets: Changeset[]) {
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

export function phasedMigratorLayer(props?: MigratorLayerProps) {
	return Layer.effect(
		Migrator,
		Effect.gen(function* () {
			const folder =
				props?.migrationFolder ?? (yield* appEnvironmentMigrationsFolder);
			const db = props?.client ?? (yield* DbClients).currentEnvironment.kysely;
			const provider = new FileMigrationProvider({
				fs,
				path,
				migrationFolder: folder,
			});
			const name = props?.name ?? "migration";
			const migrationTableName = `kysely_${name}`;
			const migrationLockTableName = `kysely_${name}_lock`;
			const migrator = new MonolayerMigrator({
				db,
				provider,
				migrationTableName,
				migrationLockTableName,
			});
			return new PhasedMigrator(migrator, folder);
		}),
	);
}
