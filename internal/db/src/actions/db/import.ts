import type { Command } from "@commander-js/extra-typings";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliActionWithoutContext } from "~db/cli-action.js";
import { importSchema } from "../import-schema.js";

export function importDb(program: Command, packageName: string) {
	program
		.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [
				Effect.provide(
					importSchema,
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
