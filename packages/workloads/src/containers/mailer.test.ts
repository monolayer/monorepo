import nodemailer from "nodemailer";
import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { startContainer, test } from "~test/__setup__/container-test.js";
import { MailerContainer } from "~workloads/containers/mailer.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";

const mailer = new Mailer("test-mailer", (connectionStringEnvVar) =>
	nodemailer.createTransport(process.env[connectionStringEnvVar]),
);

test(
	"Mailer started container workload id label",
	{ sequential: true },
	async ({ containers }) => {
		const container = new MailerContainer(mailer);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"mailer-test-mailer",
		);
	},
);

test(
	"Exposed ports of a mailer container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new MailerContainer(mailer);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertExposedPorts({
			container: startedContainer,
			ports: [1025, 8025],
		});
	},
);

test(
	"Assigned connection string to environment variable after start",
	{ sequential: true },
	async ({ containers }) => {
		delete process.env.MONO_MAILER_TEST_MAILER_URL;
		const container = new MailerContainer(mailer);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.MONO_MAILER_TEST_MAILER_URL,
			`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
		);
	},
);

test("Connection string URL", { sequential: true }, async ({ containers }) => {
	const container = new MailerContainer(mailer);
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	assert.strictEqual(
		container.connectionURI,
		`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
	);
});

test("Web URL", { sequential: true }, async ({ containers }) => {
	const container = new MailerContainer(mailer);
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	assert.strictEqual(
		container.webURL,
		`http://${startedContainer.getHost()}:${startedContainer.getMappedPort(8025)}/`,
	);
});

test(
	"Mailer with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const mailer = new Mailer("test-mailer-send", (connectionStringEnvVar) =>
			nodemailer.createTransport(process.env[connectionStringEnvVar]),
		);
		mailer.containerOptions({
			imageName: "axllent/mailpit:v1.21",
		});
		const container = new MailerContainer(mailer);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertContainerImage({
			workload: mailer,
			expectedImage: "axllent/mailpit:v1.21",
		});
		await startedContainer.stop();
	},
);
