import { text } from "@clack/prompts";

export async function revisionNamePrompt() {
	return await text({
		message: "Enter a name for the schema revision",
		placeholder: "Add users table",
		validate(value) {
			if (value.length === 0) return `Description is required`;
		},
	});
}
