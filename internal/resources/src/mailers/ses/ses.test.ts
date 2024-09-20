import { assert, beforeAll, test } from "vitest";
import type { StartedSESContainer } from "~resources/mailers/ses/container.js";
import { defineSESMailer, type SESMailer } from "~resources/mailers/ses/ses.js";
import { sesEmails } from "~resources/mailers/ses/testing.js";

let sesMailer: SESMailer;
let startedContainer: StartedSESContainer;

beforeAll(async () => {
	process.env.F4_ENV = "local";
	const ses = defineSESMailer("test-ses");
	sesMailer = ses;
	startedContainer = await ses.container.start();
}, 100000);

test("send emails", async () => {
	await sesMailer.client.sendEmail({
		Source: "sender@example.com",
		Destination: {
			ToAddresses: ["recipient@example.com"],
		},
		ReplyToAddresses: [],
		Message: {
			Body: {
				Text: {
					Charset: "UTF-8",
					Data: "I hope this message gets there!",
				},
			},
			Subject: {
				Charset: "UTF-8",
				Data: "Message",
			},
		},
	});

	const emails = await sesEmails(startedContainer.serverPort);
	assert.strictEqual(emails.length, 1);

	const email = emails.at(0);
	assert.strictEqual(email.from, "sender@example.com");
	assert.deepStrictEqual(email.destination, {
		to: ["recipient@example.com"],
		cc: [],
		bcc: [],
	});
	assert.strictEqual(email.subject, "Message");
	assert.deepStrictEqual(email.body, {
		text: "I hope this message gets there!",
	});
});
