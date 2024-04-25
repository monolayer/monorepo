import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { cancelOperation } from "./cancel-operation.js";
import { localPendingSchemaRevisions } from "./local-pending-schema-revisions.js";

export function handlePendingSchemaRevisions() {
	return localPendingSchemaRevisions().pipe(
		Effect.flatMap((pendingRevisions) =>
			Effect.if(pendingRevisions.length > 0, {
				onTrue: logPendingRevisions(pendingRevisions).pipe(
					Effect.flatMap(() =>
						askConfirmationDelete().pipe(
							Effect.flatMap((shouldContinue) =>
								Effect.if(shouldContinue === true, {
									onTrue: deletePendingRevisions(pendingRevisions),
									onFalse: cancelOperation(),
								}),
							),
						),
					),
				),
				onFalse: Effect.succeed(true),
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

function deletePendingRevisions(
	pending: {
		name: string;
		path: string;
	}[],
) {
	return Effect.succeed(true).pipe(
		Effect.flatMap(() =>
			Effect.forEach(pending, (pendingRevision) =>
				Effect.succeed(true).pipe(
					Effect.map(() => {
						unlinkSync(pendingRevision.path);
						p.log.info(
							`${color.red("removed")} ${path.relative(cwd(), pendingRevision.path)}`,
						);
					}),
				),
			),
		),
	);
}
