import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { messages } from "~workloads/test-helpers/mailer.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test("Mailer client commands against test container", async ({
	containers,
}) => {
	const mailer = new Mailer("test-mailer-send", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]),
	);
	const container = new MailerContainer(mailer);
	const startedContainer = await startContainer(container);

	containers.push(startedContainer);
	const response = await messages(mailer);
	assert(response.data);
	assert.deepStrictEqual(response.data.messages, []);
	assert.strictEqual(response.data.total, 0);
	assert.strictEqual(response.data.unread, 0);
	assert.strictEqual(response.data.messages_count, 0);
	assert.strictEqual(response.data.start, 0);
	assert.deepStrictEqual(response.data.tags, []);
});

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const mailer = new Mailer("test-mailer-send", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]),
	);

	type ClientType = typeof mailer.client;
	type ExpectedType = nodemailer.Transporter<
		SMTPTransport.SentMessageInfo,
		SMTPTransport.Options
	>;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});
