import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import type {
	Options,
	RequestResult,
} from "~sidecar/test-helpers/mailpit/generated/client/index.js";
import {
	deleteMessagesParams,
	getMessageHtmlParams,
	getMessagesParams,
	getMessageTextParams,
} from "~sidecar/test-helpers/mailpit/generated/services.gen.js";
import type {
	DeleteMessagesParamsData,
	GetMessageHtmlParamsData,
	GetMessageTextParamsData,
	MessagesSummary,
} from "~sidecar/test-helpers/mailpit/generated/types.gen.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";

/**
 * List messages
 * Returns messages from the mailbox ordered from newest to oldest.
 */
export async function messages<C>(
	mailer: Mailer<C>,
): Promise<RequestResult<MessagesSummary, string>> {
	return await getMessagesParams({
		baseUrl: await testMailerURL(mailer),
	});
}

/**
 * Render message text part
 * Renders just the message's text part which can be used for UI integration testing.
 *
 * The ID can be set to `latest` to return the latest message.
 */
export async function messageText<C, ThrowOnError extends boolean = false>(
	mailer: Mailer<C>,
	options: Options<GetMessageTextParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return getMessageTextParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

/**
 * Delete messages
 * Delete individual or all messages. If no IDs are provided then all messages are deleted.
 */
export async function deleteMessages<C, ThrowOnError extends boolean = false>(
	mailer: Mailer<C>,
	options: Options<DeleteMessagesParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return await deleteMessagesParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

/**
 * Render message HTML part
 * Renders just the message's HTML part which can be used for UI integration testing.
 * Attached inline images are modified to link to the API provided they exist.
 * Note that is the message does not contain a HTML part then an 404 error is returned.
 *
 * The ID can be set to `latest` to return the latest message.
 */
export async function messageHtml<C, ThrowOnError extends boolean = false>(
	mailer: Mailer<C>,
	options: Options<GetMessageHtmlParamsData, ThrowOnError>,
): Promise<RequestResult<string, string, ThrowOnError>> {
	return await getMessageHtmlParams({
		baseUrl: await testMailerURL(mailer),
		...options,
	});
}

async function testMailerURL<C>(mailer: Mailer<C>) {
	const url = new URL(process.env[mailer.connectionStringEnvVar()]!);
	const httpURL = new URL("", "http://base.com");
	httpURL.host = url.host;
	httpURL.port = await mailerWebUIHostPort(mailer);
	return httpURL.toString();
}

async function mailerWebUIHostPort<C>(mailer: Mailer<C>) {
	const container = await getExistingContainer(mailer);
	if (container === undefined) {
		throw new Error(`container for Mailer workload ${mailer.id} not found`);
	}
	const inspect = await container.inspect();
	const ports = inspect.NetworkSettings.Ports;
	return ports["8025/tcp"]![0]!["HostPort"];
}
