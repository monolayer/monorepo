import type { ActionError, PromptCancelError } from "@monorepo/cli/errors.js";
import {
	type MonolayerMigration,
	type MonolayerMigrationInfo,
	type MonolayerMigrationInfoWithPhase,
} from "@monorepo/migrator/migration.js";
import type {
	Changeset,
	ChangesetPhase,
} from "@monorepo/pg/changeset/types.js";
import {
	appEnvironmentMigrationsFolder,
	type AppEnvironment,
} from "@monorepo/state/app-environment.js";
import type { PackageNameState } from "@monorepo/state/package-name.js";
import { Context, Effect, Layer } from "effect";
import type { UnknownException } from "effect/Cause";
import {
	CamelCasePlugin,
	Kysely,
	MigrationResultSet,
	NoMigrations,
	PostgresDialect,
} from "kysely";
import { DbClients } from "~services/db-clients.js";
import { PhasedMigrator } from "~services/migrator/phased-migrator.js";
import { databasePoolFromEnvironment } from "~services/pg-pool.js";

export interface MigrationStats {
	all: MonolayerMigrationInfo[];
	executed: MonolayerMigrationInfo[];
	pending: MonolayerMigrationInfo[];
	localPending: PendingMigration[];
}
export interface PendingMigration {
	name: string;
	path: string;
	phase: ChangesetPhase;
}

export type MigratorInterface = {
	migrationStats: Effect.Effect<
		MigrationStats,
		UnknownException | ActionError,
		Migrator
	>;
	migrateToLatest: (
		printWarnings?: boolean,
	) => Effect.Effect<
		MigrationResultSet,
		UnknownException | ActionError,
		Migrator
	>;
	migratePhaseToLatest: (
		phase: ChangesetPhase,
		printWarnings?: boolean,
	) => Effect.Effect<
		MigrationResultSet,
		UnknownException | ActionError,
		Migrator
	>;
	migrateTargetUpInPhase: (
		phase: ChangesetPhase,
		migrationName: string,
	) => Effect.Effect<
		MigrationResultSet,
		UnknownException | ActionError,
		Migrator
	>;
	rollback(
		migrations: MonolayerMigrationInfo[],
	): Effect.Effect<void, ActionError | UnknownException, never>;
	rollbackAll: Effect.Effect<MigrationResultSet, UnknownException, never>;
	renderChangesets(
		changesets: Changeset[],
		migrationName: string,
	): Effect.Effect<
		string[],
		UnknownException | ActionError | PromptCancelError,
		DbClients | AppEnvironment | PackageNameState
	>;
	pendingMigrations: Effect.Effect<
		MonolayerMigrationInfoWithPhase[],
		UnknownException | ActionError,
		never
	>;
};

export class Migrator extends Context.Tag("Migrator")<
	Migrator,
	MigratorInterface
>() {
	static readonly LiveLayer = (props?: MigratorLayerProps) =>
		Layer.effect(
			Migrator,
			Effect.gen(function* () {
				const folder =
					props?.migrationFolder ?? (yield* appEnvironmentMigrationsFolder);
				const db = props?.client ?? (yield* DbClients).kysely;
				return new PhasedMigrator(db, folder);
			}),
		);
	static readonly TestLayer = (
		databaseName: string,
		migrationFolder: string,
		camelCase = false,
	) => {
		const pool = databasePoolFromEnvironment(databaseName);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const db = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: pool,
			}),
			plugins: camelCase ? [new CamelCasePlugin()] : [],
		});
		return Migrator.LiveLayer({ client: db, migrationFolder });
	};
}

export interface MigratorLayerProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	client?: Kysely<any>;
	migrationFolder?: string;
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

interface MigrationPhaseStat {
	all: MonolayerMigrationInfo[];
	pending: MonolayerMigrationInfo[];
	executed: MonolayerMigrationInfo[];
	localPending: { name: string; path: string }[];
}

export interface MigrationsByPhase {
	expand: MigrationPhaseStat;
	contract: MigrationPhaseStat;
}
