import {
	type CodeChangeset,
	ChangesetPhase,
} from "~db-push/changeset/types/changeset.js";
import type { MigrationsByPhase } from "~db-push/migrator/push-migrator.js";

export function codeChangesetByPhase(changeset: CodeChangeset[]) {
	return changeset.reduce<Required<MigrationsByPhase>>(
		(acc, codeChangeset) => {
			switch (codeChangeset.phase) {
				case ChangesetPhase.Expand:
					acc.expand.push({
						...codeChangeset,
						phase: ChangesetPhase.Expand,
					});
					break;
				case ChangesetPhase.Alter:
					acc.alter.push({
						...codeChangeset,
						phase: ChangesetPhase.Alter,
					});
					break;
				case ChangesetPhase.Contract:
					acc.contract.push({
						...codeChangeset,
						phase: ChangesetPhase.Contract,
					});
					break;
			}
			return acc;
		},
		{ expand: [], contract: [], alter: [] },
	);
}
