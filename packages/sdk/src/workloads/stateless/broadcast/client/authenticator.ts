/**
 * @module authenticator
 * This module provides functions for handling the specific authentication
 * handshake required by the AWS AppSync Events WebSocket protocol.
 */

/**
 * Encodes a JSON authorization object into a Base64URL string.
 *
 * The AWS AppSync WebSocket protocol requires authorization credentials to be
 * passed in a custom subprotocol header. This function takes the authorization
 * object, stringifies it, and then encodes it into a URL-safe Base64 format
 * by replacing `+` with `-`, `/` with `_`, and removing padding.
 *
 * @param authorization The authorization object to encode.
 * @returns A Base64URL encoded string representing the authorization object.
 */
export function encodeAuthorization(authorization: object): string {
	const jsonString = JSON.stringify(authorization);
	// Note: Using the browser's btoa function for simplicity. In a Node.js
	// environment, this would be replaced with Buffer.from(str).toString('base64').
	// However, for the purpose of this library, we assume a browser-like environment
	// or a polyfill for btoa.
	const base64 = btoa(jsonString);

	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generates the full WebSocket subprotocol string for authorization.
 *
 * This function takes an authorization object, encodes it using `encodeAuthorization`,
 * and then prepends the `header-` prefix as required by the AWS AppSync Events
 * WebSocket protocol for the subprotocol header.
 *
 * @param authorization The authorization object to use for generating the protocol string.
 * @returns The complete authorization subprotocol string (e.g., `header-encodedAuthString`).
 */
export function getAuthProtocol(authorization: object): string {
	const encodedHeader = encodeAuthorization(authorization);
	return `header-${encodedHeader}`;
}
