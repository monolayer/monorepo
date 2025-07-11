/**
 * @module messageBuilder
 * Provides utility functions for constructing WebSocket messages
 * according to the AWS AppSync Events API protocol.
 */

/**
 * Builds a 'subscribe' message for the AWS AppSync Events API.
 *
 * @param id A unique identifier for the subscription.
 * @param channel The channel path to subscribe to (e.g., '/my/channel').
 * @param authorization An object containing the authorization details for the subscription.
 * @returns A JSON object representing the 'subscribe' message.
 */
export function buildSubscribeMessage(
	id: string,
	channel: string,
	authorization: object,
): object {
	return {
		type: "subscribe",
		id,
		channel,
		authorization,
	};
}

/**
 * Builds a 'publish' message for the AWS AppSync Events API.
 *
 * @param id A unique identifier for the publish operation.
 * @param channel The channel path to publish to.
 * @param events An array of stringified JSON events to be published.
 * @param authorization An object containing the authorization details for the publish operation.
 * @returns A JSON object representing the 'publish' message.
 */
export function buildPublishMessage(
	id: string,
	channel: string,
	events: string[],
	authorization: object,
): object {
	return {
		type: "publish",
		id,
		channel,
		events,
		authorization,
	};
}
