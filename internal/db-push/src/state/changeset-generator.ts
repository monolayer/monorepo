import type {
	ColumnsToRename,
	TablesToRename,
} from "@monorepo/pg/introspection/schema.js";
import type { TypeAlignment } from "@monorepo/programs/introspect/alignment.js";
import { Context, Effect, Layer, Ref } from "effect";
import { flatMap } from "effect/Effect";
import type { SchemaMigrationInfo } from "~db-push/changeset/types/schema.js";

export class ChangesetGeneratorState extends Context.Tag(
	"ChangesetGeneratorState",
)<ChangesetGeneratorState, Ref.Ref<ChangesetGenerator>>() {
	static current = ChangesetGeneratorState.pipe(
		flatMap((generatorState) => Ref.get(generatorState)),
	);

	static update = (newState: Partial<ChangesetGenerator>) =>
		ChangesetGeneratorState.pipe(
			flatMap((generatorState) =>
				Ref.update(generatorState, (current) => {
					return {
						...current,
						...newState,
					};
				}),
			),
		);

	static provide<A, E, R>(
		effect: Effect.Effect<A, E, R>,
		initalState?: ChangesetGenerator,
	) {
		return Effect.provide(
			effect,
			Layer.effect(
				ChangesetGeneratorState,
				Ref.make(initalState ?? changesetGeneratorEmptyState),
			),
		);
	}
}

export interface ChangesetGenerator {
	local: SchemaMigrationInfo;
	db: SchemaMigrationInfo;
	addedTables: string[];
	droppedTables: string[];
	schemaName: string;
	camelCase: boolean;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
	typeAlignments: TypeAlignment[];
	addedColumns: Record<string, string[]>;
	droppedColumns: Record<string, string[]>;
	debug: boolean;
}

const emptySchemaMigrationInto = {
	table: {},
	index: {},
	foreignKeyConstraints: {},
	uniqueConstraints: {},
	checkConstraints: {},
	primaryKey: {},
	triggers: {},
	enums: {},
	foreignKeyDefinitions: {},
	tablePriorities: [],
	schemaInfo: {},
};

export const changesetGeneratorEmptyState = {
	local: {
		...emptySchemaMigrationInto,
	},
	db: {
		...emptySchemaMigrationInto,
	},
	addedTables: [],
	droppedTables: [],
	droppedColumns: {},
	schemaName: "",
	camelCase: false,
	tablesToRename: [],
	columnsToRename: {},
	typeAlignments: [],
	addedColumns: {},
	debug: false,
} satisfies ChangesetGenerator;
