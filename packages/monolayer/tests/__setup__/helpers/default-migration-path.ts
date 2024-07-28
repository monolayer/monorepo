import path from "path";
import { ChangesetPhase } from "../../../src/changeset/types.js";

export function expandMigrationPath(folder: string) {
	return path.join(
		folder,
		"monolayer",
		"migrations",
		"default",
		ChangesetPhase.Expand,
	);
}

export function contractMigrationPath(folder: string) {
	return path.join(
		folder,
		"monolayer",
		"migrations",
		"default",
		ChangesetPhase.Contract,
	);
}

export function alterMigrationPath(folder: string) {
	return path.join(
		folder,
		"monolayer",
		"migrations",
		"default",
		ChangesetPhase.Alter,
	);
}
