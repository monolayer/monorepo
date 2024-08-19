import { confirm } from "@clack/prompts";
import { cancelOperation } from "@monorepo/base/programs/cancel-operation.js";
import {
	logPendingMigrations,
	pendingMigrations,
} from "@monorepo/programs/migrations/pending.js";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import color from "picocolors";

export const handlePendingSchemaMigrations = Effect.gen(function* () {
	const localPending = yield* pendingMigrations;
	if (localPending.length == 0) return true;

	yield* logPendingMigrations;

	if (yield* askConfirmationDelete) {
		yield* deletePendingMigrations(localPending);
	} else {
		yield* cancelOperation();
	}
});

const askConfirmationDelete = Effect.gen(function* () {
	const promptConfirm = yield* Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending schema migrations to apply and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
	return promptConfirm === true;
});

interface PendingMigration {
	name: string;
	path: string;
}

export function deletePendingMigrations(pendingMigrations: PendingMigration[]) {
	return Effect.gen(function* () {
		for (const migration of pendingMigrations) {
			unlinkSync(migration.path);
		}
		return yield* Effect.succeed(true);
	});
}
