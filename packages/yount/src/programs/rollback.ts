import * as p from "@clack/prompts";
import { Effect } from "effect";
import { NO_MIGRATIONS, type MigrationInfo } from "kysely";
import path from "path";
import {
	confirmDeletePendingRevisionsPrompt,
	confirmRollbackPrompt,
	confirmRollbackWithScaffoldedRevisionsPrompt,
	rollbackRevisionPrompt,
} from "~/prompts/rollback-revision.js";
import {
	migrationInfoToRevisions,
	type Revision,
} from "~/revisions/revision.js";
import { Environment } from "~/services/environment.js";
import { allRevisions } from "../revisions/all-revisions.js";
import { cancelOperation } from "./cancel-operation.js";
import { ExitWithSuccess } from "./cli-action.js";
import { deletePendingRevisions } from "./delete-pending-revisions.js";
import { migrateTo } from "./migrate-to.js";
import { pendingMigrations } from "./pending-migrations.js";

export function rollback() {
	return Effect.gen(function* (_) {
		const executedRevisions = yield* _(executedRevisionsWithCheck());

		if (executedRevisions.length === 0) {
			p.log.info("Nothing to rollback.");
			return yield* _(Effect.succeed(true));
		}

		p.log.info(`You have ${executedRevisions.length} revisions applied.`);
		const promptResult = yield* _(promptRollback(executedRevisions, 10));

		yield* _(confirmRollback(promptResult.revisionNames));

		yield* _(
			confirmRollbackWithScafoldedRevisions(
				migrationInfoToRevisions(executedRevisions),
			),
		);

		const migration = yield* _(migrateTo(promptResult.downTo));
		if (!migration) {
			return yield* _(Effect.succeed(false));
		}

		p.log.info("Pending revisions after rollback:");

		yield* _(pendingMigrations());

		if (yield* _(confirmDelete())) {
			yield* _(
				nameAndPath(
					executedRevisions.filter((r) =>
						promptResult.revisionNames.includes(r.name),
					),
				).pipe(Effect.tap(deletePendingRevisions)),
			);
		}
		yield* _(Effect.succeed(true));
	});
}

function executedRevisionsWithCheck() {
	return allRevisions().pipe(
		Effect.flatMap((migrations) => {
			if (migrations.length === 0) {
				p.log.warn("Nothing to squash. There are no revisions.");
				return Effect.fail(new ExitWithSuccess({ cause: "No revisions" }));
			}

			return Effect.succeed(
				migrations.filter((m) => m.executedAt !== undefined),
			);
		}),
	);
}

function confirmRollback(revisions: string[]) {
	return Effect.tryPromise(() => confirmRollbackPrompt(revisions)).pipe(
		Effect.flatMap((proceedWithSquash) => {
			if (typeof proceedWithSquash === "symbol" || !proceedWithSquash) {
				return cancelOperation();
			}
			return Effect.succeed(true);
		}),
	);
}

function confirmDelete() {
	return Effect.gen(function* (_) {
		const confirm = yield* _(
			Effect.tryPromise(() => confirmDeletePendingRevisionsPrompt()),
		);
		if (typeof confirm === "symbol") {
			yield* _(cancelOperation());
		}
		assertBoolean(confirm);
		return confirm;
	});
}

function assertBoolean(value: unknown): asserts value is boolean {
	true;
}

function revisionsForPrompt(
	revisions: readonly MigrationInfo[],
	limit: number,
) {
	const revisionValues = revisions.map((m) => {
		return {
			value: m.name,
		};
	});
	revisionValues.unshift({
		value: `rollback all revisions (${revisions.length})`,
	});
	revisionValues.pop();
	return revisionValues.slice(-limit);
}

function promptRollback(revisions: readonly MigrationInfo[], limit: number) {
	return Effect.gen(function* (_) {
		const revision = yield* _(
			Effect.tryPromise(() =>
				rollbackRevisionPrompt(revisionsForPrompt(revisions, limit)),
			),
		);
		if (typeof revision === "symbol") {
			yield* _(cancelOperation());
		}
		const findRevisionIndex = revisions.findIndex((m) => m.name === revision);
		const revisionNames = revisions
			.slice(findRevisionIndex == -1 ? 0 : findRevisionIndex + 1)
			.map((m) => m.name);
		return yield* _(
			Effect.succeed({
				revisionNames,
				downTo:
					findRevisionIndex === -1
						? NO_MIGRATIONS
						: revisions[findRevisionIndex]!.name,
			}),
		);
	});
}

function confirmRollbackWithScafoldedRevisions(
	revisions: Required<Revision>[],
) {
	return Effect.gen(function* (_) {
		if (revisions.every((r) => !r.scaffold)) {
			return;
		}
		const scaffoldedRevisions = revisions
			.filter((r) => r.scaffold)
			.map((r) => r.name!);
		return yield* _(
			Effect.tryPromise(() =>
				confirmRollbackWithScaffoldedRevisionsPrompt(scaffoldedRevisions),
			).pipe(
				Effect.flatMap((proceedWithSquash) => {
					if (typeof proceedWithSquash === "symbol" || !proceedWithSquash) {
						return cancelOperation();
					}
					return Effect.succeed(true);
				}),
			),
		);
	});
}

function nameAndPath(revisions: MigrationInfo[]) {
	return Effect.gen(function* (_) {
		const env = yield* _(Environment);
		return revisions.map((rev) => ({
			name: rev.name,
			path: path.join(env.schemaRevisionsFolder, `${rev.name}.ts`),
		}));
	});
}
