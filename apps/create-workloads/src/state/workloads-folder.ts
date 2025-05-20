import { Context, Ref } from "effect";
import { gen } from "effect/Effect";
import { get, make, update } from "effect/Ref";

export interface WorkloadsFolder {
	path?: string;
}
export class WorkloadsFolderState extends Context.Tag("WorkloadsFolderState")<
	WorkloadsFolderState,
	Ref.Ref<WorkloadsFolder>
>() {
	static get current() {
		return gen(function* () {
			return yield* get(yield* WorkloadsFolderState);
		});
	}

	static update(folderPath: string) {
		return gen(function* () {
			yield* update(yield* WorkloadsFolderState, () => {
				return { path: folderPath };
			});
		});
	}
}

export class UndefinedWorkloadsFolderError extends TypeError {
	constructor() {
		super(`The workloads folder path is undefined.`);
	}
}

export const defaultWorkloadsFolderRef = make({} as WorkloadsFolder);
