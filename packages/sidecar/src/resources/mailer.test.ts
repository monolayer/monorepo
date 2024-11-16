import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { Mailer } from "~sidecar/resources/mailer.js";
import { testMailerURL } from "~sidecar/testing/mailer.js";
import { getMessagesParams } from "~sidecar/testing/mailpit-client/index.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("Mailer client commands against test container", async ({
	containers,
}) => {
	const mailer = new Mailer("test-mailer-send", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]),
	);

	const container = new MailerContainer(mailer);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	const response = await getMessagesParams({
		baseUrl: await testMailerURL(mailer),
	});
	assert(response.data);
	assert.deepStrictEqual(response.data.messages, []);
	assert.strictEqual(response.data.total, 0);
	assert.strictEqual(response.data.unread, 0);
	assert.strictEqual(response.data.messages_count, 0);
	assert.strictEqual(response.data.start, 0);
	assert.deepStrictEqual(response.data.tags, []);
});

test(
	"Mailer with custom image tag container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const mailer = new Mailer("test-mailer-send", (connectionStringEnvVar) =>
			nodemailer.createTransport(process.env[connectionStringEnvVar]),
		);
		Mailer.containerImage = "axllent/mailpit:v1.21";
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			containerName: container.name,
			expectedImage: "axllent/mailpit:v1.21",
		});
		await startedContainer.stop();
	},
);

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
