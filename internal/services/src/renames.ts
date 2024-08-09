import type {
	ColumnsToRename,
	TablesToRename,
} from "@monorepo/pg/introspection/schema.js";
import { Context, Effect, Layer } from "effect";

interface RenameProperties {
	readonly tables: TablesToRename;
	readonly columns: ColumnsToRename;
}

export class Renames extends Context.Tag("Reames")<
	Renames,
	RenameProperties
>() {}

export function migrationInfo(options: RenameProperties) {
	return Layer.effect(Renames, Effect.succeed(options));
}
