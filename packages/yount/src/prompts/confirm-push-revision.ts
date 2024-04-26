import * as p from "@clack/prompts";

export async function confirmPushRevision() {
	return await p.confirm({
		initialValue: false,
		message: `Do you want to push the generated schema revision?`,
	});
}
