import { Effect } from "effect";
import type { MigrationInfo } from "kysely";
import {
	RevisionError,
	migrationInfoToRevisions,
	type Revision,
	type RevisionMigration,
} from "~/revisions/revision.js";
import { Migrator } from "~/services/migrator.js";

export function validateRevisionDependencies() {
	getMigrationInfo().pipe(
		Effect.tap(validateMigrationInfoAsRevision),
		Effect.flatMap(revisionsFromMigrationInfo),
		Effect.flatMap(validateRevisions),
	);
}

function getMigrationInfo() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		return yield* _(Effect.tryPromise(() => migrator.instance.getMigrations()));
	});
}

function revisionsFromMigrationInfo(migrationInfo: readonly MigrationInfo[]) {
	return Effect.succeed(migrationInfoToRevisions(migrationInfo));
}

class MissingDependenciesError extends TypeError {
	constructor(revision: string) {
		super(`revision ${revision} is missing dependsOn export`);
	}
}

function validateMigrationInfoAsRevision(
	migrationInfo: readonly MigrationInfo[],
): Effect.Effect<boolean, MissingDependenciesError, never> {
	for (const migration of migrationInfo) {
		const migrationWithDependecies = migration.migration as RevisionMigration;
		if (migrationWithDependecies.revision === undefined) {
			return Effect.die(new RevisionError(migration.name));
		}
		if (migrationWithDependecies.revision.dependsOn === undefined) {
			return Effect.die(new MissingDependenciesError(migration.name));
		}
	}
	return Effect.succeed(true);
}

class MultipleRevisionsWithNoDependencyError extends TypeError {
	constructor(revisions: string[]) {
		super(`multiple revisions with no dependency`, {
			cause: { revisionsWithNoDependency: revisions },
		});
	}
}

class RevisionWithMoreThanOneDependantError extends TypeError {
	constructor(revision: string, dependants: string[]) {
		super(`revision ${revision} has more than one dependant`, {
			cause: { revision, dependants },
		});
	}
}

class RevisionDependencyError extends AggregateError {
	constructor(reason: DependencyErrors) {
		const errors = [];
		if (reason.multipleRevisionsNoDependency.length > 0) {
			errors.push(
				new MultipleRevisionsWithNoDependencyError(
					reason.multipleRevisionsNoDependency,
				),
			);
		}
		if (Object.keys(reason.revisionsWithMoreThanOneDependant).length > 0) {
			for (const [revision, dependants] of Object.entries(
				reason.revisionsWithMoreThanOneDependant,
			)) {
				errors.push(
					new RevisionWithMoreThanOneDependantError(revision, dependants),
				);
			}
		}
		super(errors, errors.map((error) => error.message).join(", "));
		this.cause = errors.map((error) => error.cause);
	}
}

function validateRevisions(revisions: Required<Revision>[]) {
	return Effect.gen(function* (_) {
		const dependencyErrors = mapRevisionDependencies(revisions);
		if (
			dependencyErrors.multipleRevisionsNoDependency.length > 0 ||
			Object.keys(dependencyErrors.revisionsWithMoreThanOneDependant).length > 0
		) {
			return yield* _(
				Effect.die(new RevisionDependencyError(dependencyErrors)),
			);
		}
		return true;
	});
}

interface DependencyErrors {
	multipleRevisionsNoDependency: string[];
	revisionsWithMoreThanOneDependant: Record<string, string[]>;
}

function mapRevisionDependencies(revisions: Required<Revision>[]) {
	const dependencies = revisions.reduce(
		(acc, revision) => {
			const key =
				typeof revision.dependsOn === "string"
					? revision.dependsOn
					: "NO_DEPENDENCY";
			acc[key] = [...(acc[key] || []), revision.name];
			return acc;
		},
		{} as Record<string, string[]>,
	);
	const errors: DependencyErrors = {
		multipleRevisionsNoDependency: [],
		revisionsWithMoreThanOneDependant: {},
	};
	for (const key in dependencies) {
		const dependents = dependencies[key]!;
		if (dependents.length === 1) continue;
		if (key === "NO_DEPENDENCY") {
			errors.multipleRevisionsNoDependency = dependents;
		} else {
			errors.revisionsWithMoreThanOneDependant[key] = dependents;
		}
	}
	return errors;
}
