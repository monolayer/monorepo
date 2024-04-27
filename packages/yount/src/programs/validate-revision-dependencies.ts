import { Effect } from "effect";
import type { Migration, MigrationInfo } from "kysely";
import type { NoDependencies } from "~/revisions/revision.js";
import { Migrator } from "~/services/migrator.js";

interface MigrationWithDependencies extends Migration {
	dependsOn: NoDependencies | string;
}

export function validateRevisionDependencies() {
	return Effect.gen(function* (_) {
		const migrationInfo = yield* _(getPendingMigrationInfo());
		yield* _(validateDependsOn(migrationInfo));
		const revisions = migrationInfoToRevisions(migrationInfo);
		return yield* _(validateRevisions(revisions));
	});
}

function getPendingMigrationInfo() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		const migrations = yield* _(
			Effect.tryPromise(() => migrator.instance.getMigrations()),
		);
		return migrations.filter((info) => info.executedAt === undefined);
	});
}

interface Revision {
	name: string;
	dependsOn: NoDependencies | string;
}

function migrationInfoToRevisions(migrationInfo: readonly MigrationInfo[]) {
	return migrationInfo.map((info) => {
		const revision = info.migration as MigrationWithDependencies;
		return {
			name: info.name,
			dependsOn: revision.dependsOn,
		} satisfies Revision;
	});
}

class MissingDependenciesError {
	readonly _tag = "MissingDependenciesError";
	readonly _revision: string;

	constructor(revision: string) {
		this._revision = revision;
	}
}

function validateDependsOn(
	migrationInfo: readonly MigrationInfo[],
): Effect.Effect<boolean, MissingDependenciesError, never> {
	for (const migration of migrationInfo) {
		const migrationWithDependecies =
			migration.migration as MigrationWithDependencies;
		if (migrationWithDependecies.dependsOn === undefined) {
			return Effect.fail(new MissingDependenciesError(migration.name));
		}
	}
	return Effect.succeed(true);
}

class RevisionDependencyError {
	readonly _tag = "RevisionDependencyError";
	readonly _reason: DependencyErrors;

	constructor(reason: DependencyErrors) {
		this._reason = reason;
	}
}

function validateRevisions(revisions: Revision[]) {
	return Effect.gen(function* (_) {
		const dependencyErrors = mapRevisionDependencies(revisions);
		if (
			dependencyErrors.multipleRevisionsNoDependency.length > 0 ||
			Object.keys(dependencyErrors.revisionsWithMoreThanOneDependant).length > 0
		) {
			return yield* _(
				Effect.fail(new RevisionDependencyError(dependencyErrors)),
			);
		}
		return true;
	});
}
new Error();
interface DependencyErrors {
	multipleRevisionsNoDependency: string[];
	revisionsWithMoreThanOneDependant: Record<string, string[]>;
}

function mapRevisionDependencies(revisions: Revision[]) {
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
