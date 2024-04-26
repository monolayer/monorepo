import * as p from "@clack/prompts";
import { Effect } from "effect";
import { NO_MIGRATIONS, type MigrationInfo } from "kysely";
import path from "path";
import { confirmPushRevision } from "~/prompts/confirm-push-revision.js";
import {
	confirmSquashPrompt,
	squashRevisionsPrompt,
} from "~/prompts/squash-revisions.js";
import { DevEnvironment } from "~/services/environment.js";
import { allMigrations } from "./all-migrations.js";
import { applyRevisions } from "./apply-revisions.js";
import { cancelOperation } from "./cancel-operation.js";
import { ExitWithSuccess } from "./cli-action.js";
import { deletePendingRevisions } from "./delete-pending-revisions.js";
import { generateRevision } from "./generate-revision.js";
import { localPendingSchemaRevisions } from "./local-pending-schema-revisions.js";
import { migrateTo } from "./migrate-to.js";

export function squash() {
	return Effect.gen(function* (_) {
		yield* _(checkPendingSchemaRevisions());

		const executedRevisions = yield* _(executedRevisionsWithCheck());

		const promptResult = yield* _(promptSquash(executedRevisions, 10));

		yield* _(confirmSquash(promptResult.revisionNames));

		const migration = yield* _(migrateTo(promptResult.downTo));
		if (!migration) {
			return yield* _(Effect.succeed(false));
		}

		yield* _(deletePendingRevisions(promptResult.revisionToRemove));

		const changeset = yield* _(generateRevision());

		if (changeset.length > 0) {
			const pushChanges = yield* _(
				Effect.tryPromise(() => confirmPushRevision()),
			);
			if (typeof pushChanges === "symbol" || !pushChanges) {
				return yield* _(cancelOperation());
			}
			yield* _(applyRevisions(changeset));
		}

		yield* _(Effect.succeed(true));
	});
}

function checkPendingSchemaRevisions() {
	return localPendingSchemaRevisions().pipe(
		Effect.flatMap((pending) => {
			if (pending.length !== 0) {
				p.log.warn("There are pending revisions.");
				return Effect.fail(new ExitWithSuccess({ cause: "Pending revisions" }));
			}
			return Effect.succeed(pending);
		}),
	);
}

function executedRevisionsWithCheck() {
	return allMigrations().pipe(
		Effect.flatMap((migrations) => {
			if (migrations.length === 0) {
				p.log.warn("Nothing to squash. There are no revisions.");
				return Effect.fail(new ExitWithSuccess({ cause: "No revisions" }));
			}

			if (migrations.length === 1) {
				p.log.warn("Nothing to squash. There's only one revision.");
				return Effect.fail(new ExitWithSuccess({ cause: "Only one revision" }));
			}
			return Effect.succeed(migrations);
		}),
	);
}

function confirmSquash(revisions: string[]) {
	return Effect.tryPromise(() => confirmSquashPrompt(revisions)).pipe(
		Effect.flatMap((proceedWithSquash) => {
			if (typeof proceedWithSquash === "symbol" || !proceedWithSquash) {
				return cancelOperation();
			}
			return Effect.succeed(true);
		}),
	);
}

function revisionsForPrompt(
	revisions: readonly MigrationInfo[],
	limit: number,
) {
	return revisions
		.map((m) => {
			return {
				value: m.name,
			};
		})
		.slice(-limit);
}

function promptSquash(revisions: readonly MigrationInfo[], limit: number) {
	return Effect.gen(function* (_) {
		const devEnvironment = yield* _(DevEnvironment);
		const revision = yield* _(
			Effect.tryPromise(() =>
				squashRevisionsPrompt(revisionsForPrompt(revisions, limit)),
			),
		);
		if (typeof revision === "symbol") {
			yield* _(cancelOperation());
		}
		const revisionIndex = revisions.findIndex((m) => m.name === revision);

		const revisionNames = revisions.slice(revisionIndex).map((m) => m.name);
		const downTo =
			revisionIndex === 0 ? NO_MIGRATIONS : revisions[revisionIndex - 1]!.name;
		const revisionToRemove = revisions.slice(revisionIndex).map((m) => {
			return {
				name: m.name,
				path: path.join(devEnvironment.schemaRevisionsFolder, `${m.name}.ts`),
			};
		});

		return yield* _(
			Effect.succeed({
				revisionNames,
				downTo,
				revisionToRemove,
			}),
		);
	});
}
