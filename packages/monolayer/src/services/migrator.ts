import { Context, Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import {
	Migrator as KyselyMigrator,
	type Kysely,
	type MigrationResult,
	type MigrationResultSet,
	type NoMigrations,
} from "kysely";
import { ActionError, ExitWithSuccess } from "~/cli/errors.js";
import type {
	MonolayerMigration,
	MonolayerMigrationInfo,
} from "~/migrations/migration.js";
import { type AppEnvironment } from "~/state/app-environment.js";
import type { Changeset } from "../changeset/types.js";
import { DbClients } from "./db-clients.js";

export type MigratorInterface = {
	all: Effect.Effect<
		MonolayerMigrationInfo[],
		UnknownException | ActionError,
		Migrator
	>;
	executed: Effect.Effect<
		MonolayerMigrationInfo[],
		UnknownException | ActionError | ExitWithSuccess,
		Migrator
	>;
	readonly pending: Effect.Effect<
		MonolayerMigrationInfo[],
		UnknownException | ActionError,
		never
	>;
	nextDependency: Effect.Effect<
		string,
		UnknownException | ActionError,
		Migrator
	>;
	migrateToLatest: Effect.Effect<
		{
			error?: unknown;
			results?: MigrationResult[] | undefined;
		},
		UnknownException | ActionError,
		Migrator
	>;
	migrateToLatestPlan(
		migrations: MonolayerMigrationInfo[],
	): MigrationPlanGroup[];
	migrateTo(
		migration: MigrationPlanGroup,
		direction: "up" | "down",
	): Effect.Effect<MigrationResultSet, UnknownException, Migrator>;
	rollbackPlan(
		migrations: MonolayerMigrationInfo[],
		target: string | NoMigrations,
	): MigrationPlanGroup[];
	renderChangesets(
		changesets: Changeset[],
		migrationName: string,
	): Effect.Effect<
		void,
		UnknownException | ActionError,
		DbClients | AppEnvironment
	>;
	rollbackAll: Effect.Effect<MigrationResultSet, UnknownException, never>;
	localPendingSchemaMigrations: Effect.Effect<
		{
			name: string;
			path: string;
		}[],
		UnknownException | ActionError,
		Migrator | AppEnvironment
	>;
};

export class Migrator extends Context.Tag("Migrator")<
	Migrator,
	MigratorInterface
>() {}

export class MonolayerMigrator extends KyselyMigrator {
	declare migrateWithTransaction: boolean;
}

export interface MigratorLayerProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	client?: Kysely<any>;
	migrationFolder?: string;
	name?: string;
}

export interface MigrationPlanGroup {
	up: string;
	down: string | NoMigrations;
	transaction: boolean;
}

export function isExtendedMigration(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	obj: any,
): obj is Required<MonolayerMigration> {
	return obj.migration !== undefined;
}

export function isolateMigrations(
	migrations: readonly MonolayerMigrationInfo[],
) {
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
