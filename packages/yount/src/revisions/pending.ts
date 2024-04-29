import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import type { MigrationInfo } from "kysely";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { schemaRevisionsFolder } from "~/services/environment.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { allRevisions } from "./revision.js";

export function pendingRevisions() {
	return localPendingSchemaRevisions().pipe(
		Effect.tap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: () =>
					Effect.forEach(pendingMigrations, logPendingRevisionsNames),
				onFalse: () => logNoPendingRevisions(),
			}),
		),
	);
}

function logNoPendingRevisions() {
	return Effect.void.pipe(
		Effect.tap(() => p.log.message("No pending revisions.")),
	);
}

function logPendingRevisionsNames(migration: { name: string; path: string }) {
	p.log.message(
		`${color.yellow("pending")} ${path.basename(migration.path, ".ts")}`,
	);
	return Effect.void;
}

export function handlePendingSchemaRevisions() {
	return localPendingSchemaRevisions().pipe(
		Effect.flatMap((pendingRevisions) =>
			Effect.if(pendingRevisions.length > 0, {
				onTrue: () =>
					logPendingRevisions(pendingRevisions).pipe(
						Effect.flatMap(() =>
							askConfirmationDelete().pipe(
								Effect.flatMap((shouldContinue) =>
									Effect.if(shouldContinue === true, {
										onTrue: () => deletePendingRevisions(pendingRevisions),
										onFalse: () => cancelOperation(),
									}),
								),
							),
						),
					),
				onFalse: () => Effect.succeed(true),
			}),
		),
	);
}

function logPendingRevisions(
	pending: {
		name: string;
		path: string;
	}[],
) {
	return Effect.succeed(true).pipe(
		Effect.tap(() =>
			Effect.forEach(pending, (pendingMigration) =>
				Effect.succeed(
					p.log.warn(
						`${color.yellow("pending")} ${path.relative(cwd(), pendingMigration.path)}`,
					),
				),
			),
		),
	);
}

function askConfirmationDelete() {
	return Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending schema revisions to apply and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
}

interface PendingRevision {
	name: string;
	path: string;
}

export function deletePendingRevisions(pendingRevisions: PendingRevision[]) {
	return Effect.forEach(pendingRevisions, deletePendingRevision).pipe(
		Effect.map(() => true),
	);
}

function deletePendingRevision(revision: PendingRevision) {
	return Effect.succeed(unlinkSync(revision.path));
}

export function localPendingSchemaRevisions() {
	return Effect.gen(function* (_) {
		const folder = yield* _(schemaRevisionsFolder());

		return (yield* _(allRevisions()))
			.filter(byNotExecuted)
			.map((m) => revisionNameAndPath(m, folder));
	});
}

function byNotExecuted(info: MigrationInfo) {
	return info.executedAt === undefined;
}

function revisionNameAndPath(info: MigrationInfo, folder: string) {
	return {
		name: info.name,
		path: path.join(folder, `${info.name}.ts`),
	};
}
