import path from "path";

export function defaultMigrationPath(folder: string) {
	return path.join(folder, "db", "revisions", "default");
}