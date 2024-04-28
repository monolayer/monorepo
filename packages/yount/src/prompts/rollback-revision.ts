import * as p from "@clack/prompts";
import { select } from "@clack/prompts";
type RevisionSelection = {
	value: string;
	label?: string | undefined;
	hint?: string | undefined;
};

export async function rollbackRevisionPrompt(revisions: RevisionSelection[]) {
	const selection = await select<RevisionSelection[], string>({
		message: "Select a revision to rollback to:",
		options: revisions.map((revision) => ({
			value: revision.value,
		})),
	});
	return selection;
}

export async function confirmRollbackPrompt(revisions: string[]) {
	p.log.warning(`The following revisions will be discarded:
${revisions.map((revision) => `- ${revision}`).join("\n")}`);
	return await p.confirm({
		initialValue: false,
		message: `Do you want to continue?`,
	});
}

export async function confirmRollbackWithScaffoldedRevisionsPrompt(
	revisions: string[],
) {
	p.log.warning(`Some of the revisions to be discarded are scaffolded`);
	p.log.message(
		"Their changes will not be added to the new revision and the resulting revision may fail.",
	);
	p.log.message(`Scaffolded revisions:
${revisions.map((revision) => `- ${revision}`).join("\n")}`);
	return await p.confirm({
		initialValue: false,
		message: `Do you want to continue?`,
	});
}

export async function confirmDeletePendingRevisionsPrompt() {
	return await p.confirm({
		initialValue: false,
		message: `Do you want to delete the revision files?`,
	});
}
