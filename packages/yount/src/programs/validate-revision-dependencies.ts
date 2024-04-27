import { Effect } from "effect";
import type { Migration, MigrationInfo } from "kysely";
import type { Revision } from "~/revisions/revision.js";
import { Migrator } from "~/services/migrator.js";

interface MigrationWithDependencies extends Migration {
	revision: Revision;
}

export function validateRevisionDependencies() {
	return Effect.gen(function* (_) {
		const migrationInfo = yield* _(getMigrationInfo());
		yield* _(validateDependsOn(migrationInfo));
		const revisions = migrationInfoToRevisions(migrationInfo);
		return yield* _(validateRevisions(revisions));
	});
}

function getMigrationInfo() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		return yield* _(Effect.tryPromise(() => migrator.instance.getMigrations()));
	});
}

function migrationInfoToRevisions(migrationInfo: readonly MigrationInfo[]) {
	return migrationInfo.map((info) => {
		const revision = info.migration as MigrationWithDependencies;
		return {
			...revision.revision,
			name: info.name,
		} satisfies Revision;
	});
}

class MissingDependenciesError extends TypeError {
	constructor(revision: string) {
		super(`revision ${revision} is missing dependsOn export`);
	}
}

class RevisionError extends TypeError {
	constructor(revision: string) {
		super(`undefined revision in ${revision}`);
	}
}

function validateDependsOn(
	migrationInfo: readonly MigrationInfo[],
): Effect.Effect<boolean, MissingDependenciesError, never> {
	for (const migration of migrationInfo) {
		const migrationWithDependecies =
			migration.migration as MigrationWithDependencies;
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
