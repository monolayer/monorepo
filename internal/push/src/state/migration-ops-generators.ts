import { Context, Effect, Layer, Ref } from "effect";
import { gen } from "effect/Effect";
import type { Difference } from "microdiff";
import type { CodeChangeset } from "~push/changeset/types/changeset.js";
import type { ChangesetGeneratorState } from "./changeset-generator.js";

export type MigrationOpsGenerators = ((
	diff: Difference,
) => Effect.Effect<
	CodeChangeset | CodeChangeset[] | undefined,
	never,
	ChangesetGeneratorState
>)[];

export class MigrationOpsGeneratorsState extends Context.Tag(
	"MigrationOpsGenerators",
)<MigrationOpsGeneratorsState, Ref.Ref<MigrationOpsGenerators>>() {
	static get current() {
		return gen(function* () {
			return yield* Ref.get(yield* MigrationOpsGeneratorsState);
		});
	}
	static provide<A, E, R>(
		effect: Effect.Effect<A, E, R>,
		initalState?: MigrationOpsGenerators,
	) {
		return Effect.provide(
			effect,
			Layer.effect(
				MigrationOpsGeneratorsState,
				Ref.make(initalState ?? ([] as MigrationOpsGenerators)),
			),
		);
	}
}
