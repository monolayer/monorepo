import { text } from "@clack/prompts";

export async function migrationNamePrompt() {
	return await text({
		message: "Enter a name for the schema migration",
		placeholder: "Example: add users table",
		validate(value) {
			if (value.length === 0) return `Description is required`;
		},
	});
}
