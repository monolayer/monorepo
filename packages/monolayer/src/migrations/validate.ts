import { Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import { ActionError } from "~/cli/errors.js";
import {
	migrationInfoToMigration,
	type Migration,
	type MonolayerMigration,
	type MonolayerMigrationInfo,
} from "~/migrations/migration.js";
import { Migrator } from "~/services/migrator.js";

export const validateMigrationDependencies = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const migrationInfo = (yield* migrator.migrationStats).all;
	yield* validateMigrationInfoAsMigration(migrationInfo);
	return yield* validateMigrations(migrationInfoToMigration(migrationInfo));
});

function validateMigrationInfoAsMigration(
	migrationInfo: readonly MonolayerMigrationInfo[],
): Effect.Effect<boolean, ActionError | UnknownException, never> {
	return Effect.gen(function* () {
		for (const migration of migrationInfo) {
			const migrationWithDependecies =
				migration.migration as MonolayerMigration;
			if (migrationWithDependecies.migration === undefined) {
				yield* Effect.die(
					new ActionError(
						"Undefined migration",
						`undefined migration in ${migration.name}`,
					),
				);
			}
			if (migrationWithDependecies.migration.dependsOn === undefined) {
				yield* Effect.die(
					new ActionError(
						"Missing migration dependencies",
						`migration ${migration.name} is missing dependsOn export`,
					),
				);
			}
		}
		return true;
	});
}

export class MultipleMigrationsWithNoDependencyError extends TypeError {
	constructor(migrations: string[]) {
		super(`multiple migrations with no dependency`, {
			cause: { migrationsWithNoDependency: migrations },
		});
	}
}

export class MigrationWithMoreThanOneDependantError extends TypeError {
	constructor(migration: string, dependants: string[]) {
		super(`migration ${migration} has more than one dependant`, {
			cause: { migration: migration, dependants },
		});
	}
}

export class MigrationDependencyError {
	declare readonly _tag: "MigrationDependencyError";
	errors: (
		| MultipleMigrationsWithNoDependencyError
		| MigrationWithMoreThanOneDependantError
	)[];
	message: string;

	constructor(reason: DependencyErrors) {
		this.errors = [];
		this.message = "";
		if (reason.multipleMigrationsNoDependency.length > 0) {
			this.errors.push(
				new MultipleMigrationsWithNoDependencyError(
					reason.multipleMigrationsNoDependency,
				),
			);
		}
		if (Object.keys(reason.migrationsWithMoreThanOneDependant).length > 0) {
			for (const [migration, dependants] of Object.entries(
				reason.migrationsWithMoreThanOneDependant,
			)) {
				this.errors.push(
					new MigrationWithMoreThanOneDependantError(migration, dependants),
				);
			}
		}
		this.message = this.errors.map((error) => error.message).join(", ");
	}
}

function validateMigrations(
	migrations: Migration[],
): Effect.Effect<boolean, MigrationDependencyError | UnknownException, never> {
	return Effect.gen(function* () {
		const dependencyErrors = mapMigrationDependencies(migrations);
		if (
			dependencyErrors.multipleMigrationsNoDependency.length > 0 ||
			Object.keys(dependencyErrors.migrationsWithMoreThanOneDependant).length >
				0
		) {
			yield* Effect.die(new MigrationDependencyError(dependencyErrors));
		}
		return true;
	});
}

interface DependencyErrors {
	multipleMigrationsNoDependency: string[];
	migrationsWithMoreThanOneDependant: Record<string, string[]>;
	missingNames: boolean;
}

function mapMigrationDependencies(migrations: Migration[]) {
	const dependencies = migrations.reduce(
		(acc, migration) => {
			const key =
				typeof migration.dependsOn === "string"
					? migration.dependsOn
					: "NO_DEPENDENCY";
			acc[key] = [...(acc[key] || []), migration.name ?? ""];
			return acc;
		},
		{} as Record<string, string[]>,
	);
	const errors: DependencyErrors = {
		multipleMigrationsNoDependency: [],
		migrationsWithMoreThanOneDependant: {},
		missingNames: false,
	};
	for (const key in dependencies) {
		const dependents = dependencies[key]!;
		if (dependents.length === 1) continue;
		if (key === "NO_DEPENDENCY") {
			errors.multipleMigrationsNoDependency = dependents;
		} else {
			if (key === "") {
				errors.missingNames = true;
			} else {
				errors.migrationsWithMoreThanOneDependant[key] = dependents;
			}
		}
	}
	return errors;
}
