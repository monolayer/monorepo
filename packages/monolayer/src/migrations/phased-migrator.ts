/* eslint-disable max-lines */
import { Effect, Layer } from "effect";
import { mkdirSync } from "fs";
import { FileMigrationProvider, type Kysely } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { cwd } from "process";
import { DbClients } from "~/services/db-clients.js";
import {
	Migrator,
	MigratorLayerProps,
	type MigrationStats,
	type MigratorInterface,
} from "~/services/migrator.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { printWarnigns } from "../changeset/print-changeset-summary.js";
import { type Changeset } from "../changeset/types.js";
import { type ChangeWarning } from "../changeset/warnings.js";
import { ActionError } from "../cli/errors.js";
import { logMigrationResultStatus } from "./apply.js";
import {
	Phase,
	collectResults,
	extractMigrationOps,
	isolateTransactionlessChangesets,
	migrationInfoToMonolayerMigrationInfo,
	migrationPlanTwo,
	splitChangesetsByPhase,
	type MigrationPhase,
	type MonolayerMigrationInfo,
	type MonolayerMigrationInfoWithExecutedAt,
} from "./migration.js";
import {
	MonolayerMigrator,
	NO_MIGRATIONS,
	type MigrationResult,
	type MigrationResultSet,
} from "./migrator.js";
import { renderToFile } from "./render.js";

export class PhasedMigrator implements MigratorInterface {
	protected readonly unsafeInstance: MonolayerMigrator;
	protected readonly expandInstance: MonolayerMigrator;
	protected readonly contractInstance: MonolayerMigrator;
	protected readonly folder: string;
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		client: Kysely<any>,
		folder: string,
	) {
		this.unsafeInstance = makeMigrator(client, folder, "unsafe");
		this.expandInstance = makeMigrator(client, folder, "expand");
		this.contractInstance = makeMigrator(client, folder, "contract");
		this.folder = folder;
	}

	get migrationStats() {
		return Effect.gen(this, function* () {
			const folder = this.folder;
			mkdirSync(path.join(folder, "unsafe"), { recursive: true });
			mkdirSync(path.join(folder, "expand"), { recursive: true });
			mkdirSync(path.join(folder, "contract"), { recursive: true });
			const all = [
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "expand"),
					yield* this.#allExpandMigrations(),
					Phase.Expand,
				)),
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "unsafe"),
					yield* this.#allUnsafeMigrations(),
					Phase.Unsafe,
				)),
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "contract"),
					yield* this.#allContractMigrations(),
					Phase.Contract,
				)),
			];
			const pending = all.filter((m) => m.executedAt === undefined);
			return {
				all,
				executed: all
					.filter(
						(m): m is MonolayerMigrationInfoWithExecutedAt =>
							m.executedAt !== undefined,
					)
					.sort((ma, mb) => ma.executedAt.getTime() - mb.executedAt.getTime()),
				pending,
				localPending: pending.map((info) => {
					return {
						name: info.name,
						path: path.join(this.folder, info.phase, `${info.name}.ts`),
						phase: info.phase as "expand" | "unsafe" | "contract",
					};
				}),
			} satisfies MigrationStats;
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
			const stats = yield* this.migrationStatsByPhase;
			const pending = [
				...stats.expand.pending.map((stat) => ({
					...stat,
					phase: Phase.Expand,
				})),
				...stats.unsafe.pending.map((stat) => ({
					...stat,
					phase: Phase.Unsafe,
				})),
				...stats.contract.pending.map((stat) => ({
					...stat,
					phase: Phase.Contract,
				})),
			];

			if (printWarnings === true) this.#printWarnings(pending);

			const migratedSteps: MigrationPhase[] = [];
			for (const planPhase of [
				...migrationPlanTwo(
					stats.expand.pending.map((stat) => ({
						...stat,
						phase: Phase.Expand,
					})),
				),
				...migrationPlanTwo(
					stats.unsafe.pending.map((stat) => ({
						...stat,
						phase: Phase.Unsafe,
					})),
				),
				...migrationPlanTwo(
					stats.contract.pending.map((stat) => ({
						...stat,
						phase: Phase.Contract,
					})),
				),
			]) {
				const migrationResult = yield* this.#migratePhase(planPhase, "Up");
				results = [...results, migrationResult];

				if (migrationResult.error !== undefined) {
					yield* this.#rollbackPeformedMigrations(planPhase, migratedSteps);
					break;
				}
				migratedSteps.push(planPhase);
			}

			const totalMigrations = results.reduce(
				(acc, result) => acc + (result.results ?? []).length,
				0,
			);

			const notExecuted = pending.slice(totalMigrations).map(
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

	#printWarnings(pendingMigrations: MonolayerMigrationInfo[]) {
		printWarnigns(
			pendingMigrations
				.flatMap((c) => c.warnings)
				.filter((c): c is ChangeWarning => c !== undefined),
		);
	}

	#migratorForPhase(phase: "unsafe" | "expand" | "contract") {
		switch (phase) {
			case "unsafe":
				return this.unsafeInstance;
			case "expand":
				return this.expandInstance;
			case "contract":
				return this.contractInstance;
		}
	}

	#migratePhase(phase: MigrationPhase, direction: "Up" | "Down") {
		return Effect.gen(this, function* () {
			const migrator = this.#migratorForPhase(phase.phase);
			migrator.migrateWithTransaction = phase.transaction;
			return yield* Effect.tryPromise(() =>
				migrator.migrate(() => ({
					direction: direction,
					step: phase.steps,
				})),
			);
		});
	}

	#rollbackPeformedMigrations(
		currentPhase: MigrationPhase,
		performedPhases: MigrationPhase[],
	) {
		return Effect.gen(this, function* () {
			const rollbackPhases =
				currentPhase.transaction === true
					? [...performedPhases].reverse()
					: [...performedPhases, currentPhase].reverse();

			for (const phase of rollbackPhases) {
				yield* this.#migratePhase(phase, "Down");
			}
		});
	}

	get migrationStatsByPhase() {
		return Effect.gen(this, function* () {
			const folder = this.folder;
			mkdirSync(path.join(folder, "unsafe"), { recursive: true });
			mkdirSync(path.join(folder, "expand"), { recursive: true });
			mkdirSync(path.join(folder, "contract"), { recursive: true });
			const all = {
				expand: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "expand"),
					yield* this.#allExpandMigrations(),
					Phase.Expand,
				),
				unsafe: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "unsafe"),
					yield* this.#allUnsafeMigrations(),
					Phase.Unsafe,
				),
				contract: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, "contract"),
					yield* this.#allContractMigrations(),
					Phase.Contract,
				),
			};
			return {
				expand: {
					all: all.expand,
					executed: all.expand.filter((m) => m.executedAt !== undefined),
					pending: all.expand.filter((m) => m.executedAt === undefined),
					localPending: all.expand
						.filter((m) => m.executedAt === undefined)
						.map((info) => {
							return {
								name: info.name,
								path: path.join(this.folder, "expand", `${info.name}.ts`),
							};
						}),
				},
				unsafe: {
					all: all.unsafe,
					executed: all.unsafe.filter((m) => m.executedAt !== undefined),
					pending: all.unsafe.filter((m) => m.executedAt === undefined),
					localPending: all.unsafe
						.filter((m) => m.executedAt === undefined)
						.map((info) => {
							return {
								name: info.name,
								path: path.join(this.folder, "unsafe", `${info.name}.ts`),
							};
						}),
				},
				contract: {
					all: all.contract,
					executed: all.contract.filter((m) => m.executedAt !== undefined),
					pending: all.contract.filter((m) => m.executedAt === undefined),
					localPending: all.contract
						.filter((m) => m.executedAt === undefined)
						.map((info) => {
							return {
								name: info.name,
								path: path.join(this.folder, "contract", `${info.name}.ts`),
							};
						}),
				},
			};
		});
	}

	#allExpandMigrations() {
		return Effect.tryPromise(() => this.expandInstance.getMigrations());
	}

	#allUnsafeMigrations() {
		return Effect.tryPromise(() => this.unsafeInstance.getMigrations());
	}

	#allContractMigrations() {
		return Effect.tryPromise(() => this.contractInstance.getMigrations());
	}

	get rollbackAll() {
		return Effect.gen(this, function* () {
			const contractRollback = yield* Effect.tryPromise(() =>
				this.contractInstance.migrateTo(NO_MIGRATIONS),
			);
			const unsafeRollback = yield* Effect.tryPromise(() =>
				this.unsafeInstance.migrateTo(NO_MIGRATIONS),
			);
			const expandRollBack = yield* Effect.tryPromise(() =>
				this.expandInstance.migrateTo(NO_MIGRATIONS),
			);
			const result = collectResults([
				contractRollback,
				unsafeRollback,
				expandRollBack,
			]);
			return result;
		});
	}

	rollback(migrations: MonolayerMigrationInfo[]) {
		return Effect.gen(this, function* () {
			for (const migration of migrations) {
				const { error, results } = yield* this.#migratePhase(
					{
						steps: 1,
						migrations: [migration],
						transaction: migration.transaction ?? true,
						phase: migration.phase,
					},
					"Down",
				);
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
			return true;
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
		return Effect.gen(this, function* () {
			const stats = yield* migrator.migrationStats;
			const migrations = stats.all;
			const dependency =
				migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
			const byPhase = splitChangesetsByPhase(changesets);
			const renderedMigrations: string[] = [];
			let previousMigrationName: string = "";
			const isolatedExpand = isolateTransactionlessChangesets(
				byPhase["expand"],
			);
			const isolatedUnsafe = isolateTransactionlessChangesets(
				byPhase["unsafe"],
			);
			const isolatedContract = isolateTransactionlessChangesets(
				byPhase["contract"],
			);
			const multipleMigrations =
				isolatedExpand.length +
					isolatedUnsafe.length +
					isolatedContract.length >
				1;
			let idx = 0;

			const isolatedChangesets: [string, Changeset[][]][] = [
				["expand", isolateTransactionlessChangesets(byPhase["expand"])],
				["unsafe", isolateTransactionlessChangesets(byPhase["unsafe"])],
				["contract", isolateTransactionlessChangesets(byPhase["contract"])],
			];

			for (const [phase, phaseIsolatedChangeset] of isolatedChangesets) {
				for (const isolatedChangeset of phaseIsolatedChangeset) {
					if (isolatedChangeset.length === 0) continue;
					const ops = yield* extractMigrationOps(isolatedChangeset);
					const numberedName = multipleMigrations
						? `${migrationName}-${idx + 1}`
						: migrationName;
					previousMigrationName = renderToFile(
						ops,
						path.join(folder, phase),
						numberedName,
						previousMigrationName === "" ? dependency : previousMigrationName,
						isolatedChangeset.some((m) => (m.transaction ?? true) === false)
							? false
							: true,
						this.#changesetWarnings(isolatedChangeset),
					);
					renderedMigrations.push(
						path.relative(
							cwd(),
							path.join(folder, phase, `${previousMigrationName}.ts`),
						),
					);
					idx += 1;
				}
			}
			return renderedMigrations;
		});
	}

	#changesetWarnings(changeset: Changeset[]) {
		const changesetWarnings = changeset.flatMap((m) => m.warnings ?? []);
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
		return warnings;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMigrator(client: Kysely<any>, folder: string, name: string) {
	return new MonolayerMigrator({
		db: client,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(folder, name),
		}),
		migrationTableName: `monolayer_${name}_migration`,
		migrationLockTableName: `monolayer_${name}_migration_lock`,
	});
}
