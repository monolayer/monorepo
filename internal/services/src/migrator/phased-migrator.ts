/* eslint-disable max-lines */
import * as p from "@clack/prompts";
import { ActionError } from "@monorepo/cli/errors.js";
import { FileMigrationProvider } from "@monorepo/migrator/file-migration-provider.js";
import {
	collectResults,
	isolateTransactionlessChangesets,
	migrationInfoToMonolayerMigrationInfo,
	type MigrationPhase,
	migrationPlanTwo,
	type MonolayerMigrationInfo,
	type MonolayerMigrationInfoWithExecutedAt,
	type MonolayerMigrationInfoWithPhase,
	splitChangesetsByPhase,
} from "@monorepo/migrator/migration.js";
import {
	MonolayerMigrator,
	NO_MIGRATIONS,
} from "@monorepo/migrator/migrator.js";
import { printWarnings } from "@monorepo/pg/changeset/summary.js";
import {
	type Changeset,
	ChangesetPhase,
} from "@monorepo/pg/changeset/types.js";
import type { ChangeWarning } from "@monorepo/pg/changeset/warnings/warnings.js";
import { appEnvironmentMigrationsFolder } from "@monorepo/state/app-environment.js";
import { PackageNameState } from "@monorepo/state/package-name.js";
import { createFile } from "@monorepo/utils/create-file.js";
import { dateStringWithMilliseconds } from "@monorepo/utils/date-string.js";
import { Effect, Layer } from "effect";
import { mkdirSync } from "fs";
import {
	type Kysely,
	type MigrationResult,
	type MigrationResultSet,
} from "kysely";
import fs from "node:fs/promises";
import path from "node:path";
import nunjucks from "nunjucks";
import color from "picocolors";
import { cwd } from "process";
import { DbClients } from "~services/db-clients.js";
import {
	type MigrationStats,
	Migrator,
	type MigratorInterface,
	type MigratorLayerProps,
} from "~services/migrator.js";
import { extractMigrationOps } from "~services/migrator/extract-migration-ops.js";

export class PhasedMigrator implements MigratorInterface {
	protected readonly alterInstance: MonolayerMigrator;
	protected readonly expandInstance: MonolayerMigrator;
	protected readonly contractInstance: MonolayerMigrator;
	protected readonly dataInstance: MonolayerMigrator;
	protected readonly folder: string;
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		client: Kysely<any>,
		folder: string,
	) {
		this.alterInstance = makeMigrator(client, folder, ChangesetPhase.Alter);
		this.expandInstance = makeMigrator(client, folder, ChangesetPhase.Expand);
		this.contractInstance = makeMigrator(
			client,
			folder,
			ChangesetPhase.Contract,
		);
		this.dataInstance = makeMigrator(client, folder, ChangesetPhase.Data);
		this.folder = folder;
	}

	get migrationStats() {
		return Effect.gen(this, function* () {
			const folder = this.folder;
			mkdirSync(path.join(folder, ChangesetPhase.Alter), { recursive: true });
			mkdirSync(path.join(folder, ChangesetPhase.Expand), { recursive: true });
			mkdirSync(path.join(folder, ChangesetPhase.Contract), {
				recursive: true,
			});
			mkdirSync(path.join(folder, ChangesetPhase.Data), {
				recursive: true,
			});
			const all = [
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Expand),
					yield* this.#allExpandMigrations(),
					ChangesetPhase.Expand,
				)),
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Alter),
					yield* this.#allUnsafeMigrations(),
					ChangesetPhase.Alter,
				)),
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Contract),
					yield* this.#allContractMigrations(),
					ChangesetPhase.Contract,
				)),
				...(yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Data),
					yield* this.#allDataMigrations(),
					ChangesetPhase.Data,
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
						phase: info.phase,
					};
				}),
			} satisfies MigrationStats;
		});
	}

	migrateToLatest(printWarnings = false) {
		return Effect.gen(this, function* () {
			let results: MigrationResultSet[] = [];
			const stats = yield* this.migrationStatsByPhase;
			const pending = [
				...stats.expand.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Expand,
				})),
				...stats.alter.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Alter,
				})),
				...stats.contract.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Contract,
				})),
				...stats.data.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Data,
				})),
			];

			if (printWarnings === true) this.#printWarnings(pending);

			const migratedSteps: MigrationPhase[] = [];
			for (const planPhase of [
				...migrationPlanTwo(
					stats.expand.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Expand,
					})),
				),
				...migrationPlanTwo(
					stats.alter.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Alter,
					})),
				),
				...migrationPlanTwo(
					stats.data.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Data,
					})),
				),
				...migrationPlanTwo(
					stats.contract.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Contract,
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

	migratePhaseToLatest(phase: ChangesetPhase, printWarnings = false) {
		return Effect.gen(this, function* () {
			let results: MigrationResultSet[] = [];
			const stats = yield* this.migrationStatsByPhase;
			let plan: MigrationPhase[];
			let pending: MonolayerMigrationInfoWithPhase[];
			switch (phase) {
				case ChangesetPhase.Expand:
					pending = stats.expand.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Expand,
					}));
					plan = migrationPlanTwo(pending);
					break;
				case ChangesetPhase.Alter:
					pending = stats.alter.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Alter,
					}));
					plan = migrationPlanTwo(pending);
					break;
				case ChangesetPhase.Contract:
					pending = stats.contract.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Contract,
					}));
					plan = migrationPlanTwo(pending);
					break;
				case ChangesetPhase.Data:
					pending = stats.data.pending.map((stat) => ({
						...stat,
						phase: ChangesetPhase.Data,
					}));
					plan = migrationPlanTwo(pending);
					break;
			}
			if (printWarnings === true) this.#printWarnings(pending);

			const migratedSteps: MigrationPhase[] = [];

			for (const planPhase of plan) {
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

	migrateTargetUpInPhase(phase: ChangesetPhase, migrationName: string) {
		return Effect.gen(this, function* () {
			const stats = yield* this.migrationStatsByPhase;
			const namedPending = stats[phase].pending.find(
				(m) => m.name === migrationName,
			);
			if (namedPending === undefined) {
				yield* Effect.fail(
					new ActionError(
						"Migration not found",
						`Migration ${migrationName} not found in phase ${phase}`,
					),
				);
			}
			const migrator = this.#migratorForPhase(phase);
			migrator.migrateWithTransaction = true;
			const result = yield* Effect.tryPromise(() =>
				migrator.migrateUpNamedMigration({
					...namedPending!.migration,
					name: migrationName,
				}),
			);
			return collectResults([result]);
		});
	}

	#printWarnings(pendingMigrations: MonolayerMigrationInfo[]) {
		printWarnings(
			pendingMigrations
				.flatMap((c) => c.warnings)
				.filter((c): c is ChangeWarning => c !== undefined),
		);
	}

	#migratorForPhase(phase: ChangesetPhase) {
		switch (phase) {
			case ChangesetPhase.Alter:
				return this.alterInstance;
			case ChangesetPhase.Expand:
				return this.expandInstance;
			case ChangesetPhase.Contract:
				return this.contractInstance;
			case ChangesetPhase.Data:
				return this.dataInstance;
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

	get pendingMigrations() {
		return Effect.gen(this, function* () {
			const stats = yield* this.migrationStatsByPhase;
			const pending: MonolayerMigrationInfoWithPhase[] = [
				...stats.expand.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Expand,
				})),
				...stats.alter.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Alter,
				})),
				...stats.contract.pending.map((stat) => ({
					...stat,
					phase: ChangesetPhase.Contract,
				})),
			];
			return pending;
		});
	}
	get migrationStatsByPhase() {
		return Effect.gen(this, function* () {
			const folder = this.folder;
			mkdirSync(path.join(folder, ChangesetPhase.Alter), { recursive: true });
			mkdirSync(path.join(folder, ChangesetPhase.Expand), { recursive: true });
			mkdirSync(path.join(folder, ChangesetPhase.Contract), {
				recursive: true,
			});
			mkdirSync(path.join(folder, ChangesetPhase.Data), {
				recursive: true,
			});
			const all = {
				expand: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Expand),
					yield* this.#allExpandMigrations(),
					ChangesetPhase.Expand,
				),
				alter: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Alter),
					yield* this.#allUnsafeMigrations(),
					ChangesetPhase.Alter,
				),
				contract: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Contract),
					yield* this.#allContractMigrations(),
					ChangesetPhase.Contract,
				),
				data: yield* migrationInfoToMonolayerMigrationInfo(
					path.join(folder, ChangesetPhase.Data),
					yield* this.#allDataMigrations(),
					ChangesetPhase.Data,
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
								path: path.join(
									this.folder,
									ChangesetPhase.Expand,
									`${info.name}.ts`,
								),
							};
						}),
				},
				alter: {
					all: all.alter,
					executed: all.alter.filter((m) => m.executedAt !== undefined),
					pending: all.alter.filter((m) => m.executedAt === undefined),
					localPending: all.alter
						.filter((m) => m.executedAt === undefined)
						.map((info) => {
							return {
								name: info.name,
								path: path.join(
									this.folder,
									ChangesetPhase.Alter,
									`${info.name}.ts`,
								),
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
								path: path.join(
									this.folder,
									ChangesetPhase.Contract,
									`${info.name}.ts`,
								),
							};
						}),
				},
				data: {
					all: all.data,
					executed: all.data.filter((m) => m.executedAt !== undefined),
					pending: all.data.filter((m) => m.executedAt === undefined),
					localPending: all.data
						.filter((m) => m.executedAt === undefined)
						.map((info) => {
							return {
								name: info.name,
								path: path.join(
									this.folder,
									ChangesetPhase.Data,
									`${info.name}.ts`,
								),
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
		return Effect.tryPromise(() => this.alterInstance.getMigrations());
	}

	#allContractMigrations() {
		return Effect.tryPromise(() => this.contractInstance.getMigrations());
	}

	#allDataMigrations() {
		return Effect.tryPromise(() => this.dataInstance.getMigrations());
	}

	get rollbackAll() {
		return Effect.gen(this, function* () {
			const contractRollback = yield* Effect.tryPromise(() =>
				this.contractInstance.migrateTo(NO_MIGRATIONS),
			);
			const alterRollback = yield* Effect.tryPromise(() =>
				this.alterInstance.migrateTo(NO_MIGRATIONS),
			);
			const expandRollBack = yield* Effect.tryPromise(() =>
				this.expandInstance.migrateTo(NO_MIGRATIONS),
			);
			const result = collectResults([
				contractRollback,
				alterRollback,
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
			const byPhase = splitChangesetsByPhase(changesets);
			const renderedMigrations: string[] = [];
			let previousMigrationName: string = "";
			const isolatedExpand = isolateTransactionlessChangesets(
				byPhase[ChangesetPhase.Expand],
			);
			const isolatedUnsafe = isolateTransactionlessChangesets(
				byPhase[ChangesetPhase.Alter],
			);
			const isolatedContract = isolateTransactionlessChangesets(
				byPhase[ChangesetPhase.Contract],
			);
			const multipleMigrations =
				isolatedExpand.length +
					isolatedUnsafe.length +
					isolatedContract.length >
				1;
			let idx = 0;

			const isolatedChangesets: [string, Changeset[][]][] = [
				[
					ChangesetPhase.Expand,
					isolateTransactionlessChangesets(byPhase[ChangesetPhase.Expand]),
				],
				[
					ChangesetPhase.Alter,
					isolateTransactionlessChangesets(byPhase[ChangesetPhase.Alter]),
				],
				[
					ChangesetPhase.Contract,
					isolateTransactionlessChangesets(byPhase[ChangesetPhase.Contract]),
				],
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
						isolatedChangeset.some((m) => (m.transaction ?? true) === false)
							? false
							: true,
						this.#changesetWarnings(isolatedChangeset),
						(yield* PackageNameState.current).name,
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
		allowUnorderedMigrations: true,
	});
}

export function logMigrationResultStatus(
	result: MigrationResult,
	error: unknown,
	direction: "up" | "down",
) {
	const action = direction === "up" ? "APPLIED" : "REVERTED";
	switch (result.status) {
		case "Success":
			p.log.success(
				`${color.bgGreen(color.black(` ${action} `))} ${result.migrationName}${error !== undefined ? "(ROLLBACK)" : ""}`.trimEnd(),
			);
			break;
		case "Error":
			p.log.error(
				`${color.bgRed(color.black(" ERROR "))} ${result.migrationName} (ROLLBACK)`.trimEnd(),
			);
			break;
		case "NotExecuted":
			p.log.warn(
				`${color.bgYellow(color.black(" NOT EXECUTED "))} ${result.migrationName}`,
			);
			break;
	}
	return Effect.succeed(true);
}

const template = `import { Kysely, sql } from "kysely";
import { type Migration } from "{{ packageName }}/migration";

export const migration: Migration = {
	name: "{{ name }}",
	transaction: {{ transaction | safe }},
	scaffold: false,
	warnings: {{ warnings | safe}}
};

export async function up(db: Kysely<any>): Promise<void> {
{%- for u in up %}
  {{ u | safe }}
{% endfor -%}
}

export async function down(db: Kysely<any>): Promise<void> {
{%- for downOps in down %}
  {{ downOps | safe }}
{% endfor -%}
}
`;

function renderToFile(
	upDown: {
		up: string[];
		down: string[];
	},
	folder: string,
	name: string,
	transaction: boolean,
	warnings: string,
	packageName: string,
) {
	const { up, down } = upDown;
	const dateStr = dateStringWithMilliseconds();
	const migrationName = `${dateStr}-${name}`;
	const migrationFilePath = path.join(folder, `${migrationName}.ts`);
	const rendered = nunjucks.compile(template).render({
		up: up,
		down: down,
		transaction,
		name: migrationName,
		warnings,
		packageName,
	});
	createFile(
		migrationFilePath,
		rendered.includes("sql`") ? rendered : rendered.replace(", sql", ""),
		false,
	);
	return migrationName;
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
