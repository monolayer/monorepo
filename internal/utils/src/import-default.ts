import { gen } from "effect/Effect";
import { importFile } from "./import-file.js";

export function importDefault(path: string) {
	return gen(function* () {
		const imported = yield* importFile(path);
		return imported.default && imported.default.default
			? imported.default.default
			: imported.default;
	});
}
