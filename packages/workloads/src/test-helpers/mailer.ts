import { kebabCase } from "case-anything";
import { getContainerRuntimeClient } from "testcontainers";
import { packageName } from "~workloads/configuration.js";
import type {
	Options,
	RequestResult,
} from "~workloads/test-helpers/mailpit/generated/client/index.js";
import {
	deleteMessagesParams,
	getMessageHtmlParams,
	getMessagesParams,
	getMessageTextParams,
} from "~workloads/test-helpers/mailpit/generated/services.gen.js";
import type {
	DeleteMessagesParamsData,
	GetMessageHtmlParamsData,
	GetMessageTextParamsData,
	MessagesSummary,
} from "~workloads/test-helpers/mailpit/generated/types.gen.js";
import type { Mailer } from "~workloads/workloads/stateful/mailer.js";

/**
 * List messages of a {@link Mailer} workload.
 *
 * Returns messages from the mailbox ordered from newest to oldest.
 */
export async function mailerMesages<C>(
	mailer: Mailer<C>,
): Promise<RequestResult<MessagesSummary, string>> {
	return await getMessagesParams({
		baseUrl: await testMailerURL(mailer),
	});
}

/**
 * Render message text part from a {@link Mailer} workload.
 *
 * Renders just the message's text part which can be used for UI integration testing.
 *
 * The ID can be set to `latest` to return the latest message.
 */
export async function mailerMessageText<
	C,
	ThrowOnError extends boolean = false,
>(
	mailer: Mailer<C>,
	options: Options<GetMessageTextParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return getMessageTextParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

/**
 * Delete messages from a {@link Mailer} workload.
 *
 * Delete individual or all messages. If no IDs are provided then all messages are deleted.
 */
export async function deleteMailerMessages<
	C,
	ThrowOnError extends boolean = false,
>(
	mailer: Mailer<C>,
	options: Options<DeleteMessagesParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return await deleteMessagesParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

/**
 * Render message HTML part from a {@link Mailer} workload.
 *
 * Renders just the message's HTML part which can be used for UI integration testing.
 * Attached inline images are modified to link to the API provided they exist.
 * Note that is the message does not contain a HTML part then an 404 error is returned.
 *
 * The ID can be set to `latest` to return the latest message.
 */
export async function mailerMessageHTML<
	C,
	ThrowOnError extends boolean = false,
>(
	mailer: Mailer<C>,
	options: Options<GetMessageHtmlParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return await getMessageHtmlParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

async function testMailerURL<C>(mailer: Mailer<C>) {
	const url = new URL(process.env[mailer.connectionStringEnvVar]!);
	const httpURL = new URL("", "http://base.com");
	httpURL.host = url.host;
	httpURL.port = await mailerWebUIHostPort(mailer);
	return httpURL.toString();
}

async function mailerWebUIHostPort<C>(mailer: Mailer<C>) {
	const container = await getMailerContainer(mailer);
	if (container === undefined) {
		throw new Error(`container for Mailer workload ${mailer.id} not found`);
	}
	const inspect = await container.inspect();
	const ports = inspect.NetworkSettings.Ports;
	return ports["8025/tcp"]![0]!["HostPort"];
}

async function getMailerContainer<C>(workload: Mailer<C>) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const containerId = kebabCase(
		`${workload.constructor.name.toLowerCase()}-${workload.id}`,
	);
	const listContainers = await containerRuntimeClient.container.list();
	const container = listContainers.find(
		(container) =>
			container.State === "running" &&
			container.Labels["org.monolayer-workloads.workload-id"] === containerId &&
			container.Labels["org.monolayer-workloads.package"] === packageName &&
			container.Labels["org.monolayer-workloads.mode"] === "test",
	);
	if (container) {
		return containerRuntimeClient.container.getById(container.Id);
	}
}
