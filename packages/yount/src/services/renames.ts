import { Context, Effect, Layer } from "effect";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/programs/introspect-schemas.js";

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
