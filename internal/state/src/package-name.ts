import { Context, Effect, Ref } from "effect";

export interface PackageName {
	name: string;
}

export class PackageNameState extends Context.Tag("TableColumnRenameState")<
	PackageNameState,
	Ref.Ref<PackageName>
>() {
	static get current() {
		return Effect.gen(function* () {
			return yield* Ref.get(yield* PackageNameState);
		});
	}

	static update(packageName: string) {
		return Effect.gen(function* () {
			yield* Ref.update(yield* PackageNameState, (state) => {
				return {
					...state,
					name: packageName,
				};
			});
		});
	}
}

export function makePackageNameState(packageName: string) {
	return Ref.make<PackageName>({
		name: packageName,
	});
}
