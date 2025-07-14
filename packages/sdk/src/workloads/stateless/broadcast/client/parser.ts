/**
 * @module parser
 * Provides utility functions for parsing incoming WebSocket messages
 * from the AWS AppSync Events API.
 */

/**
 * Parses a raw WebSocket message string into a structured JavaScript object.
 * @param message The raw message string received from the WebSocket.
 * @returns The parsed message object.
 * @throws {Error} If the message is not valid JSON.
 */
export function parseMessage(message: string): object {
	try {
		return JSON.parse(message);
	} catch (error) {
		throw new Error(`Failed to parse message: ${message}. Error: ${error}`);
	}
}
