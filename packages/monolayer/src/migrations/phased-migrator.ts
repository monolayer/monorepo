/* eslint-disable max-lines */
import { Effect, Layer } from "effect";
import { mkdirSync } from "fs";
import { FileMigrationProvider, type Kysely } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { cwd } from "process";
import { ActionError } from "~/cli/errors.js";
import { DbClients } from "~/services/db-clients.js";
import {
	Migrator,
	MigratorLayerProps,
	type MigratorInterface,
} from "~/services/migrator.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { printWarnigns } from "../changeset/print-changeset-summary.js";
import { type Changeset } from "../changeset/types.js";
import { type ChangeWarning } from "../changeset/warnings.js";
import { logMigrationResultStatus } from "./apply.js";
import {
	collectResults,
	extractMigrationOps,
	isolateChangesets,
	migrationInfoToMonolayerMigrationInfo,
	migrationPlan,
	type Migration,
	type MonolayerMigrationInfo,
} from "./migration.js";
import {
	MonolayerMigrator,
	NO_MIGRATIONS,
	type MigrationResult,
	type MigrationResultSet,
	type NoMigrations,
} from "./migrator.js";
import { renderToFile } from "./render.js";

export class PhasedMigrator implements MigratorInterface {
	protected readonly breakingInstance: MonolayerMigrator;
	protected readonly folder: string;
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		client: Kysely<any>,
		folder: string,
	) {
		this.breakingInstance = new MonolayerMigrator({
			db: client,
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: folder,
			}),
			migrationTableName: `monolayer_migration`,
			migrationLockTableName: `monolayer_migration_lock`,
		});
		this.folder = folder;
	}

	get migrationStats() {
		return Effect.gen(this, function* () {
			const folder = this.folder;
			mkdirSync(folder, { recursive: true });
			const all = yield* migrationInfoToMonolayerMigrationInfo(
				folder,
				yield* Effect.tryPromise(() => this.breakingInstance.getMigrations()),
			);

			const pending = all.filter((m) => m.executedAt === undefined);
			return {
				all,
				executed: all.filter((m) => m.executedAt !== undefined),
				pending,
				localPending: pending.map((info) => {
					return {
						name: info.name,
						path: path.join(this.folder, `${info.name}.ts`),
					};
				}),
			};
		});
	}

	get lastExecuted() {
		return Effect.gen(this, function* () {
			mkdirSync(this.folder, { recursive: true });
			const migrations = yield* Effect.tryPromise(() =>
				this.breakingInstance.getMigrations(),
			);
			return (
				migrations.find((m) => m.executedAt !== undefined)?.name ??
				NO_MIGRATIONS
			);
		});
	}

	get currentDependency() {
		return Effect.gen(this, function* () {
			const migrations = yield* this.migrationStats;
			return migrations.all.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
		});
	}

	migrateToLatest(printWarnings = false) {
		return Effect.gen(this, function* () {
			let results: MigrationResultSet[] = [];
			const stats = yield* this.migrationStats;
			const pendingMigrations = stats.pending;
			if (printWarnings === true) {
				printWarnigns(
					pendingMigrations
						.flatMap((c) => c.warnings)
						.filter((c): c is ChangeWarning => c !== undefined),
				);
			}
			const plan = migrationPlan(pendingMigrations);
			if (plan.length === 0) {
				return { results: [] };
			}

			const migratedSteps: {
				steps: number;
				migrations: Migration[];
				transaction: boolean;
			}[] = [];

			for (const phase of plan) {
				this.breakingInstance.migrateWithTransaction = phase.transaction;

				const migrationResult = yield* Effect.tryPromise(() =>
					this.breakingInstance.migrate(() => ({
						direction: "Up",
						step: phase.steps,
					})),
				);
				results = [...results, migrationResult];

				if (migrationResult.error !== undefined) {
					const rollbackSteps =
						phase.transaction === true
							? [...migratedSteps].reverse()
							: [...migratedSteps, phase].reverse();

					for (const rollbackPhase of rollbackSteps) {
						yield* Effect.tryPromise(() =>
							this.breakingInstance.migrate(() => ({
								direction: "Down",
								step: rollbackPhase.steps,
							})),
						);
					}
					break;
				}
				migratedSteps.push(phase);
			}

			const totalMigrations = results.reduce(
				(acc, result) => acc + (result.results ?? []).length,
				0,
			);

			const pending = pendingMigrations.slice(totalMigrations);
			const notExecuted = pending.map(
				(m) =>
					({
						migrationName: m.name!,
						direction: "Up",
						status: "NotExecuted",
					}) satisfies MigrationResult,
			);
			const resultSet: MigrationResultSet[] = [
				{
					results: notExecuted,
				},
			];
			results = [...results, ...resultSet];
			return collectResults(results);
		});
	}
	public expand = this.migrateToLatest();
	public contract = this.migrateToLatest();

	get rollbackAll() {
		return Effect.gen(this, function* () {
			return yield* Effect.tryPromise(() =>
				this.breakingInstance.migrateTo(NO_MIGRATIONS),
			);
		});
	}

	rollback(
		migrations: MonolayerMigrationInfo[],
		target: string | NoMigrations,
	) {
		return Effect.gen(this, function* () {
			const groups = migrationPlan(migrations, target).reverse();
			for (const phase of groups) {
				this.breakingInstance.migrateWithTransaction = phase.transaction;
				const migrate = Effect.tryPromise(() =>
					this.breakingInstance.migrate(() => ({
						direction: "Down",
						step: phase.steps,
					})),
				);
				const { error, results } = yield* migrate;
				const migrationSuccess = results !== undefined && results.length > 0;
				if (!migrationSuccess) {
					for (const result of results!) {
						logMigrationResultStatus(result, error, "down");
					}
					yield* Effect.fail(
						new ActionError(
							"Migration failed",
							results!.map((r) => r.migrationName).join(", "),
						),
					);
				}
				if (error !== undefined) {
					yield* Effect.fail(
						new ActionError("Rollback error", error?.toString() || ""),
					);
				}
			}
		});
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
			const stats = yield* migrator.migrationStats;
			const migrations = stats.all;
			const dependency =
				migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
			const isolatedChangesets = isolateChangesets(changesets);
			const renderedMigrations: string[] = [];
			let previousMigrationName: string = "";
			const multipleMigrations = isolatedChangesets.length > 1;
			for (const [idx, isolatedChangeset] of isolatedChangesets.entries()) {
				const ops = yield* extractMigrationOps(isolatedChangeset);
				const numberedName = multipleMigrations
					? `${migrationName}-${idx + 1}`
					: migrationName;
				const changesetWarnings = isolatedChangeset.flatMap(
					(m) => m.warnings ?? [],
				);
				const warnings =
					changesetWarnings.length === 0
						? "[],"
						: JSON.stringify(changesetWarnings, undefined, 2)
								.replace(/("(.+)"):/g, "$2:")
								.split("\n")
								.map((l, idx) =>
									idx == 0
										? l
										: l.includes("{")
											? `  ${l}`
											: `  ${l.replace(/,/, "")},`,
								)
								.join("\n");
				previousMigrationName = renderToFile(
					ops,
					folder,
					numberedName,
					previousMigrationName === "" ? dependency : previousMigrationName,
					isolatedChangeset.some((m) => (m.transaction ?? true) === false)
						? false
						: true,
					warnings,
				);
				renderedMigrations.push(
					path.relative(
						cwd(),
						path.join(folder, `${previousMigrationName}.ts`),
					),
				);
			}
			return renderedMigrations;
		});
	}
}

export function phasedMigratorLayer(props?: MigratorLayerProps) {
	return Layer.effect(
		Migrator,
		Effect.gen(function* () {
			const folder =
				props?.migrationFolder ?? (yield* appEnvironmentMigrationsFolder);
			const db = props?.client ?? (yield* DbClients).kysely;
			return new PhasedMigrator(db, folder);
		}),
	);
}
