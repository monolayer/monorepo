import path from "path";

export function expandMigrationPath(folder: string) {
	return path.join(folder, "db", "migrations", "default", "expand");
}

export function contractMigrationPath(folder: string) {
	return path.join(folder, "db", "migrations", "default", "contract");
}

export function unsafeMigrationPath(folder: string) {
	return path.join(folder, "db", "migrations", "default", "unsafe");
}
