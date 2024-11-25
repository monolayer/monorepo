import nodemailer from "nodemailer";
import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";

test(
	"Mailer started container workload id label",
	{ sequential: true },
	async ({ containers }) => {
		const mailer = new Mailer("test-mailer", (connectionStringEnvVar) =>
			nodemailer.createTransport(process.env[connectionStringEnvVar]),
		);
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"mailer-test-mailer",
		);

		await assertExposedPorts({
			container: startedContainer,
			ports: [1025, 8025],
		});

		assert.strictEqual(
			process.env.MONO_MAILER_TEST_MAILER_URL,
			`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
		);

		assert.strictEqual(
			container.connectionURI,
			`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
		);

		assert.strictEqual(
			container.webURL,
			`http://${startedContainer.getHost()}:${startedContainer.getMappedPort(8025)}/`,
		);
	},
);
