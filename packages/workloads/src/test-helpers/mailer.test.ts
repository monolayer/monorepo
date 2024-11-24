import nodemailer from "nodemailer";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import {
	deleteMailerMessages,
	mailerMesages,
	mailerMessageHTML,
	mailerMessageText,
} from "~workloads/test-helpers/mailer.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";

test("mailerMesages", { timeout: 20000 }, async ({ containers }) => {
	const mailer = new Mailer("transactions", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]!),
	);

	await startContainer(mailer, {
		mode: "test",
		waitForHealthcheck: true,
	});
	const container = await getExistingContainer(mailer, "test");
	assert(container);
	containers.push(container);

	await mailer.client.sendMail({
		from: "no-reply@workloads.com",
		to: "demo@example.com",
		subject: "Hello!",
		text: `Hi there!`,
	});

	const response = await mailerMesages(mailer);
	assert(response.data?.messages);
	assert.strictEqual(response.data.messages.length, 1);
	assert.deepStrictEqual(response.data.messages[0]?.To, [
		{ Address: "demo@example.com", Name: "" },
	]);
	assert.deepStrictEqual(response.data.messages[0]?.From, {
		Address: "no-reply@workloads.com",
		Name: "",
	});
});

test("mailerMesageText", { timeout: 20000 }, async ({ containers }) => {
	const mailer = new Mailer("transactions", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]!),
	);

	await startContainer(mailer, {
		mode: "test",
		waitForHealthcheck: true,
	});
	const container = await getExistingContainer(mailer, "test");
	assert(container);
	containers.push(container);

	await mailer.client.sendMail({
		from: "no-reply@workloads.com",
		to: "demo@example.com",
		subject: "Hello!",
		text: `Hi there!`,
	});

	const messagesResponse = await mailerMesages(mailer);
	assert(messagesResponse.data?.messages);

	const response = await mailerMessageText(mailer, {
		path: { ID: messagesResponse.data?.messages[0]!.ID ?? "" },
	});
	assert.strictEqual(response.data, "Hi there!\r\n");
});

test("deleteMailerMesages", { timeout: 20000 }, async ({ containers }) => {
	const mailer = new Mailer("transactions", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]!),
	);

	await startContainer(mailer, {
		mode: "test",
		waitForHealthcheck: true,
	});
	const container = await getExistingContainer(mailer, "test");
	assert(container);
	containers.push(container);

	await mailer.client.sendMail({
		from: "no-reply@workloads.com",
		to: "demo@example.com",
		subject: "Hello!",
		text: `Hi there!`,
	});

	await mailer.client.sendMail({
		from: "no-reply@workloads.com",
		to: "demo@example.com",
		subject: "Hello!",
		text: `Hi there!`,
	});

	assert.strictEqual((await mailerMesages(mailer)).data?.messages?.length, 2);

	await deleteMailerMessages(mailer, {});

	assert.strictEqual((await mailerMesages(mailer)).data?.messages?.length, 0);
});

test("mailerMesageHTML", { timeout: 20000 }, async ({ containers }) => {
	const mailer = new Mailer("transactions", (connectionStringEnvVar) =>
		nodemailer.createTransport(process.env[connectionStringEnvVar]!),
	);

	await startContainer(mailer, {
		mode: "test",
		waitForHealthcheck: true,
	});
	const container = await getExistingContainer(mailer, "test");
	assert(container);
	containers.push(container);

	await mailer.client.sendMail({
		from: "no-reply@workloads.com",
		to: "demo@example.com",
		subject: "Hello!",
		text: `Hi there!`,
		html: "<span>Hi There!<span>",
	});

	const messagesResponse = await mailerMesages(mailer);
	assert(messagesResponse.data?.messages);

	const response = await mailerMessageHTML(mailer, {
		path: { ID: messagesResponse.data?.messages[0]!.ID ?? "" },
	});
	assert.strictEqual(response.data, "<span>Hi There!<span>");
});
