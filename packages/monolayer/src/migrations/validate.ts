import { Effect } from "effect";
import type { MigrationInfo } from "kysely";
import {
	MigrationError,
	migrationInfoToMigration,
	type ExtendedMigration,
	type Migration,
} from "~/migrations/migration.js";
import { Migrator } from "~/services/migrator.js";

export function validateMigrationDependencies() {
	getMigrationInfo().pipe(
		Effect.tap(validateMigrationInfoAsMigration),
		Effect.flatMap(migrationsFromMigrationInfo),
		Effect.flatMap(validateMigrations),
	);
}

function getMigrationInfo() {
	return Effect.gen(function* () {
		const migrator = yield* Migrator;
		return yield* Effect.tryPromise(() => migrator.instance.getMigrations());
	});
}

function migrationsFromMigrationInfo(migrationInfo: readonly MigrationInfo[]) {
	return Effect.succeed(migrationInfoToMigration(migrationInfo));
}

class MissingDependenciesError extends TypeError {
	constructor(migration: string) {
		super(`migration ${migration} is missing dependsOn export`);
	}
}

function validateMigrationInfoAsMigration(
	migrationInfo: readonly MigrationInfo[],
): Effect.Effect<boolean, MissingDependenciesError, never> {
	for (const migration of migrationInfo) {
		const migrationWithDependecies = migration.migration as ExtendedMigration;
		if (migrationWithDependecies.migration === undefined) {
			return Effect.die(new MigrationError(migration.name));
		}
		if (migrationWithDependecies.migration.dependsOn === undefined) {
			return Effect.die(new MissingDependenciesError(migration.name));
		}
	}
	return Effect.succeed(true);
}

class MultipleMigrationsWithNoDependencyError extends TypeError {
	constructor(migrations: string[]) {
		super(`multiple migrations with no dependency`, {
			cause: { migrationsWithNoDependency: migrations },
		});
	}
}

class MigrationWithMoreThanOneDependantError extends TypeError {
	constructor(migration: string, dependants: string[]) {
		super(`migration ${migration} has more than one dependant`, {
			cause: { migration: migration, dependants },
		});
	}
}

class MigrationDependencyError extends AggregateError {
	constructor(reason: DependencyErrors) {
		const errors = [];
		if (reason.multipleMigrationsNoDependency.length > 0) {
			errors.push(
				new MultipleMigrationsWithNoDependencyError(
					reason.multipleMigrationsNoDependency,
				),
			);
		}
		if (Object.keys(reason.migrationsWithMoreThanOneDependant).length > 0) {
			for (const [migration, dependants] of Object.entries(
				reason.migrationsWithMoreThanOneDependant,
			)) {
				errors.push(
					new MigrationWithMoreThanOneDependantError(migration, dependants),
				);
			}
		}
		super(errors, errors.map((error) => error.message).join(", "));
		this.cause = errors.map((error) => error.cause);
	}
}

function validateMigrations(migrations: Required<Migration>[]) {
	return Effect.gen(function* () {
		const dependencyErrors = mapMigrationDependencies(migrations);
		if (
			dependencyErrors.multipleMigrationsNoDependency.length > 0 ||
			Object.keys(dependencyErrors.migrationsWithMoreThanOneDependant).length >
				0
		) {
			return yield* Effect.die(new MigrationDependencyError(dependencyErrors));
		}
		return true;
	});
}

interface DependencyErrors {
	multipleMigrationsNoDependency: string[];
	migrationsWithMoreThanOneDependant: Record<string, string[]>;
}

function mapMigrationDependencies(migrations: Required<Migration>[]) {
	const dependencies = migrations.reduce(
		(acc, migration) => {
			const key =
				typeof migration.dependsOn === "string"
					? migration.dependsOn
					: "NO_DEPENDENCY";
			acc[key] = [...(acc[key] || []), migration.name];
			return acc;
		},
		{} as Record<string, string[]>,
	);
	const errors: DependencyErrors = {
		multipleMigrationsNoDependency: [],
		migrationsWithMoreThanOneDependant: {},
	};
	for (const key in dependencies) {
		const dependents = dependencies[key]!;
		if (dependents.length === 1) continue;
		if (key === "NO_DEPENDENCY") {
			errors.multipleMigrationsNoDependency = dependents;
		} else {
			errors.migrationsWithMoreThanOneDependant[key] = dependents;
		}
	}
	return errors;
}
