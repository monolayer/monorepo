import type { StartedSMTPContainer } from "~resources/mailers/smtp/container.js";

export async function allMessages(container: StartedSMTPContainer) {
	const response = await fetch(container.messagesApiURL);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (await response.json()) as any;
}

export async function deleteAllMessages(container: StartedSMTPContainer) {
	await fetch(container.messagesApiURL, { method: "DELETE" });
}
