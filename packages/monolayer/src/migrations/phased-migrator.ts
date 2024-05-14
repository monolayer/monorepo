import { Effect } from "effect";
import {
	NO_MIGRATIONS,
	type MigrationResult,
	type MigrationResultSet,
	type NoMigrations,
} from "kysely";
import { MonolayerPostgresAdapter } from "~/services/db-clients.js";
import {
	Migrator,
	lastExecutedMigration,
	pendingMigrations,
} from "~/services/migrator.js";
import {
	kyselyMigrationInfoToMonolayerMigrationInfo,
	type Migration,
	type MonolayerMigrationInfo,
} from "./migration.js";

export const migrateToLatest = Effect.gen(function* () {
	let results: MigrationResultSet[] = [];
	const lastExecutedBeforeMigrate = yield* lastExecutedMigration;
	const pendingMigrations = yield* pendingMigrationsAsExtended;

	const plan = migrateToLatestPlan(pendingMigrations);

	const executed: MigrationPlanGroup[] = [];

	if (plan.length === 0) {
		return { results: [] };
	}

	for (const migration of plan) {
		const migrationResult = yield* migrateTo(migration, "up");
		results = [...results, migrationResult];

		if (migrationResult.error !== undefined) {
			yield* rollbackMigrateToLatest(lastExecutedBeforeMigrate, executed);
			results = addNotExecutedToResults(
				results,
				migration.up,
				pendingMigrations,
			);
			break;
		}
		executed.push(migration);
	}
	return collectResults(results);
});

export function migrateTo(
	migration: MigrationPlanGroup,
	direction: "up" | "down",
) {
	return Effect.gen(function* () {
		MonolayerPostgresAdapter.useTransaction = migration.transaction;
		const migrator = yield* Migrator;
		return yield* Effect.tryPromise(() =>
			migrator.instance.migrateTo(
				direction === "up" ? migration.up : migration.down,
			),
		);
	});
}

function rollbackMigrateToLatest(
	firstMigration: string | NoMigrations,
	executed: MigrationPlanGroup[],
) {
	return Effect.gen(function* () {
		const lastIndex = executed.length - 1;
		for (const [index, rollBackMigration] of executed.reverse().entries()) {
			const migraotionName =
				index === lastIndex ? firstMigration : rollBackMigration.down;
			const migration = {
				up: rollBackMigration.up,
				down: migraotionName,
				transaction: rollBackMigration.transaction,
			};
			yield* migrateTo(migration, "down");
		}
	});
}

export interface MigrationPlanGroup {
	up: string;
	down: string | NoMigrations;
	transaction: boolean;
}

export function migrateToLatestPlan(migrations: MonolayerMigrationInfo[]) {
	const groups = isolateMigrations(migrations);
	return plan(groups, "up");
}

export function rollbackPlan(
	migrations: MonolayerMigrationInfo[],
	target: string | NoMigrations,
) {
	const groups = isolateMigrations(migrations);
	const migrationPlan = plan(groups, "down");

	if (migrationPlan.length === 0) {
		return [];
	}

	if (typeof target !== "string") {
		migrationPlan[migrationPlan.length - 1]!.down = NO_MIGRATIONS;
	}

	return migrationPlan;
}

function plan(groups: Migration[][], direction: "up" | "down") {
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

function collectResults(results: MigrationResultSet[]) {
	return results.reduce<{ error?: unknown; results?: MigrationResult[] }>(
		(acc, resultSet) => {
			if (resultSet.error !== undefined) acc.error = resultSet.error;
			acc.results = [...(acc.results ?? []), ...(resultSet.results ?? [])];
			return acc;
		},
		{},
	);
}

function addNotExecutedToResults(
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

const pendingMigrationsAsExtended = Effect.gen(function* () {
	return yield* kyselyMigrationInfoToMonolayerMigrationInfo(
		yield* pendingMigrations,
	);
});

function isolateMigrations(migrations: readonly MonolayerMigrationInfo[]) {
	return migrations.reduce<Omit<MonolayerMigrationInfo, "migration">[][]>(
		(acc, migrationInfo) => {
			const lastGroup = acc.slice(-1)[0];
			if (
				lastGroup === undefined ||
				migrationInfo.transaction ||
				lastGroup.some((m) => (m.transaction ?? false) === true)
			) {
				acc.push([
					{
						name: migrationInfo.name,
						transaction: migrationInfo.transaction,
						scaffold: migrationInfo.scaffold,
						dependsOn: migrationInfo.dependsOn,
					},
				]);
			} else {
				lastGroup.push({
					name: migrationInfo.name,
					transaction: migrationInfo.transaction,
					scaffold: migrationInfo.scaffold,
					dependsOn: migrationInfo.dependsOn,
				});
			}
			return acc;
		},
		[],
	);
}
