import { remember } from "@epic-web/remember";
import { readFileSync } from "node:fs";

export const packageName = remember("packageName", () => {
	const packageJSON = JSON.parse(readFileSync("package.json").toString());
	return packageJSON.name;
});
