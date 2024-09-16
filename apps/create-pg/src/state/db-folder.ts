import { Context, Ref } from "effect";
import { gen } from "effect/Effect";
import { get, make, update } from "effect/Ref";
import path from "node:path";

export interface DbFolder {
	path?: string;
}
export class DbFolderState extends Context.Tag("DbFolderState")<
	DbFolderState,
	Ref.Ref<DbFolder>
>() {
	static get current() {
		return gen(function* () {
			return yield* get(yield* DbFolderState);
		});
	}

	static update(folderPath: string) {
		return gen(function* () {
			yield* update(yield* DbFolderState, () => {
				return { path: path.join(folderPath, "db") };
			});
		});
	}
}

export class UndefinedDbFolderError extends TypeError {
	constructor() {
		super(`The db folder path is undefined.`);
	}
}

export const defaultDbFolderRef = make({} as DbFolder);
