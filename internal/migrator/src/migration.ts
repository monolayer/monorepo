import { ActionError } from "@monorepo/base/errors.js";
import {
	MigrationOpPriority,
	type Changeset,
	type ChangesetPhase,
} from "@monorepo/pg/changeset/types.js";
import type { ChangeWarning } from "@monorepo/pg/changeset/warnings/warnings.js";
import { Effect } from "effect";
import type {
	Migration as KyselyMigration,
	MigrationInfo as KyselyMigrationInfo,
} from "kysely";
import path from "path";
import type {
	MigrationInfo,
	MigrationResult,
	MigrationResultSet,
	NoMigrations,
} from "~migrator/migrator.js";

export type Migration = {
	/**
	 * The name of the migration.
	 */
	name: string;
	/**
	 * Whether the migration was scaffolded.
	 */
	scaffold: boolean;
	/**
	 * Whether the migration runs in a transaction.
	 */
	transaction?: boolean;

	/**
	 * Migration warnings
	 */
	warnings?: Array<ChangeWarning>;
};

export type MonolayerMigrationInfo = KyselyMigrationInfo &
	Migration & { phase: ChangesetPhase };

export type MonolayerMigrationInfoWithExecutedAt = MonolayerMigrationInfo & {
	executedAt: Date;
};

export interface MonolayerMigration extends KyselyMigration {
	migration: Migration;
}

export function migrationInfoToMigration(
	migrationInfo: readonly MigrationInfo[],
) {
	return migrationInfo.map((info) => {
		return {
			...(info.migration as MonolayerMigration).migration,
			name: info.name,
			transaction: false,
		} satisfies Migration;
	});
}

export function isolateTransactionlessChangesets(changesets: Changeset[]) {
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

function isolateMigrations2(
	migrations: readonly MonolayerMigrationInfoWithPhase[],
) {
	const groups = migrations.reduce<MonolayerMigrationInfoWithPhase[][]>(
		(acc, migrationInfo) => {
			const lastGroup = acc.slice(-1)[0];
			if (
				lastGroup === undefined ||
				migrationInfo.transaction ||
				lastGroup.some((m) => (m.transaction ?? false) === true)
			) {
				acc.push([migrationInfo]);
			} else {
				lastGroup.push(migrationInfo);
			}
			return acc;
		},
		[],
	);
	return groups;
}

export interface MonolayerMigrationInfoWithPhase
	extends MonolayerMigrationInfo {
	phase: ChangesetPhase;
}

export interface MigrationPhase {
	steps: number;
	migrations: MonolayerMigrationInfoWithPhase[];
	transaction: boolean;
	phase: ChangesetPhase;
}

export type MigrationPhasePlan = {
	steps: number;
	migrations: MonolayerMigrationInfoWithPhase[];
	transaction: boolean;
	phase: ChangesetPhase;
}[];

export function migrationPlanTwo(
	migrations: MonolayerMigrationInfoWithPhase[],
	target?: string | NoMigrations,
) {
	return isolateMigrations2(migrations).flatMap((group, idx) => {
		if (group.length === 0) return [];
		return {
			steps: idx === 0 && typeof target === "object" ? Infinity : group.length,
			migrations: group,
			transaction: group.some((m) => m.transaction ?? false),
			phase: group[0]!.phase,
		} satisfies MigrationPhase;
	});
}

export function collectResults(results: MigrationResultSet[]) {
	return results.reduce<{ error?: unknown; results: MigrationResult[] }>(
		(acc, resultSet) => {
			if (resultSet.error !== undefined) acc.error = resultSet.error;
			acc.results = [...(acc.results ?? []), ...(resultSet.results ?? [])];
			return acc;
		},
		{ results: [] },
	);
}
function readMigration(folder: string, name: string) {
	return Effect.gen(function* () {
		const migrationPath = path.join(folder, `${name}.ts`);
		const migration: unknown = yield* Effect.tryPromise(
			() => import(migrationPath),
		);
		if (!isExtendedMigration(migration)) {
			const errorName = "Undefined migration";
			const errorMessage = `No migration defined migration in ${migrationPath}`;
			return yield* Effect.fail(new ActionError(errorName, errorMessage));
		}
		return migration;
	});
}

function isExtendedMigration(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	obj: any,
): obj is Required<MonolayerMigration> {
	return obj.migration !== undefined;
}

export function migrationInfoToMonolayerMigrationInfo(
	folder: string,
	migrationInfo: readonly MigrationInfo[],
	phase: ChangesetPhase,
) {
	return Effect.gen(function* () {
		const monolayerMigrationInfo: MonolayerMigrationInfo[] = [];
		for (const info of migrationInfo) {
			const migration = yield* readMigration(folder, info.name);
			monolayerMigrationInfo.push({
				...info,
				transaction: migration.migration.transaction ?? false,
				scaffold: migration.migration.scaffold,
				warnings: migration.migration.warnings,
				phase,
			});
		}
		return monolayerMigrationInfo;
	});
}

export function splitChangesetsByPhase(changesets: Changeset[]) {
	return changesets.reduce(
		(acc, changeset) => {
			acc[changeset.phase].push(changeset);
			return acc;
		},
		{
			alter: [] as Changeset[],
			expand: [] as Changeset[],
			contract: [] as Changeset[],
			data: [] as Changeset[],
		},
	);
}

export function reverseChangeset(changesets: Changeset[]) {
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
