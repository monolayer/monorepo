import * as p from "@clack/prompts";

export async function confirmPushMigration() {
	return await p.confirm({
		initialValue: false,
		message: `Do you want to push the generated schema migration?`,
	});
}
