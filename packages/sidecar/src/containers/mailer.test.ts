import { cwd } from "node:process";
import nodemailer from "nodemailer";
import path from "path";
import {
	assertBindMounts,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { MailerContainer } from "~sidecar/containers/mailer.js";
import { Mailer } from "~sidecar/resources/mailer.js";
import { test } from "~test/__setup__/container-test.js";

const mailer = new Mailer("test-mailer", (connectionStringEnvVar) =>
	nodemailer.createTransport(process.env[connectionStringEnvVar]),
);

test(
	"Mailer started container resource id label",
	{ sequential: true },
	async ({ containers }) => {
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.resource-id"],
			"test-mailer",
		);
	},
);

test(
	"Bind mounts on a mailer container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertBindMounts({
			resource: mailer,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", "mailer", "test_mailer_data")}:/data:rw`,
			],
		});
	},
);

test(
	"Exposed ports of a mailer container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
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
		delete process.env.SIDECAR_MAILER_TEST_MAILER_URL;
		const container = new MailerContainer(mailer);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.SIDECAR_MAILER_TEST_MAILER_URL,
			`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
		);
	},
);

test("Connection string URL", { sequential: true }, async ({ containers }) => {
	const container = new MailerContainer(mailer);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.connectionURI,
		`smtp://username:password@${startedContainer.getHost()}:${startedContainer.getMappedPort(1025)}`,
	);
});

test("Web URL", { sequential: true }, async ({ containers }) => {
	const container = new MailerContainer(mailer);
	const startedContainer = await container.start();
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
		const container = new MailerContainer(mailer, {
			containerImage: "axllent/mailpit:v1.21",
		});
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			resource: mailer,
			expectedImage: "axllent/mailpit:v1.21",
		});
		await startedContainer.stop();
	},
);
