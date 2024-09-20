import { afterEach, assert, beforeAll, test } from "vitest";
import type {
	SMTPContainer,
	StartedSMTPContainer,
} from "~resources/mailers/smtp/container.js";
import { defineSMTPMailer, SMTPMailer } from "~resources/mailers/smtp/smtp.js";
import {
	allMessages,
	deleteAllMessages,
} from "~resources/mailers/smtp/testing.js";

let testMailer: SMTPMailer;
let testContainer: SMTPContainer;
let startedContainer: StartedSMTPContainer;

beforeAll(async () => {
	const mailer = defineSMTPMailer("test-mailer");
	testMailer = mailer;
	testContainer = mailer.container;
	startedContainer = await testContainer.start();
});

afterEach(async () => {
	await deleteAllMessages(startedContainer);
});

test("mailerId", async () => {
	assert.equal(testMailer.id, "test-mailer");
});

test("send emails through smtp server", async () => {
	await testMailer.transporter.sendMail({
		from: "sender@example.com",
		to: "recipient@example.com",
		subject: "Message",
		text: "I hope this message gets there!",
	});

	await testMailer.transporter.sendMail({
		from: "anothersender@example.com",
		to: "anotherrecipient@example.com",
		subject: "Another Message",
		text: "Another message!",
	});

	const messages = (await allMessages(startedContainer)).messages;
	assert.equal(messages.length, 2);

	const firstMessage = messages.at(-1);

	assert.deepStrictEqual(firstMessage.From, {
		Name: "",
		Address: "sender@example.com",
	});
	assert.deepStrictEqual(firstMessage.To, [
		{
			Name: "",
			Address: "recipient@example.com",
		},
	]);

	assert.strictEqual(firstMessage.Subject, "Message");
	assert.strictEqual(firstMessage.Snippet, "I hope this message gets there!");

	const secondMessage = messages.at(0);

	assert.deepStrictEqual(secondMessage.From, {
		Name: "",
		Address: "anothersender@example.com",
	});
	assert.deepStrictEqual(secondMessage.To, [
		{
			Name: "",
			Address: "anotherrecipient@example.com",
		},
	]);

	assert.strictEqual(secondMessage.Subject, "Another Message");
	assert.strictEqual(secondMessage.Snippet, "Another message!");
});
