import { Context, Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import type { Kysely } from "kysely";
import { ActionError } from "~/cli/errors.js";
import type {
	MonolayerMigration,
	MonolayerMigrationInfo,
	MonolayerMigrationInfoWithPhase,
} from "~/migrations/migration.js";
import { type AppEnvironment } from "~/state/app-environment.js";
import type { Changeset, ChangesetPhase } from "../changeset/types.js";
import type {
	MigrationResultSet,
	NoMigrations,
} from "../migrations/migrator.js";
import { DbClients } from "./db-clients.js";

export interface MigrationStats {
	all: MonolayerMigrationInfo[];
	executed: MonolayerMigrationInfo[];
	pending: MonolayerMigrationInfo[];
	localPending: {
		name: string;
		path: string;
		phase: ChangesetPhase;
	}[];
	byPhase?: MigrationsByPhase;
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
		UnknownException | ActionError,
		DbClients | AppEnvironment
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
>() {}

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
