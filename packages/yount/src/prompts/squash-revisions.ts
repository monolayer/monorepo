import * as p from "@clack/prompts";
import { select } from "@clack/prompts";

type RevisionSelection = {
	value: string;
	label?: string | undefined;
	hint?: string | undefined;
};

export async function squashRevisionsPrompt(revisions: RevisionSelection[]) {
	const selection = await select<RevisionSelection[], string>({
		message:
			"Select revision to squash from (the selected revision and later revisions will be squashed):",
		options: revisions.map((revision) => ({
			value: revision.value,
		})),
	});
	return selection;
}

export async function confirmSquashPrompt(revisions: string[]) {
	p.log.warning(`The following revisions will be squashed:
${revisions.map((revision) => `- ${revision}`).join("\n")}`);
	return await p.confirm({
		initialValue: false,
		message: `Do you want to continue?`,
	});
}
