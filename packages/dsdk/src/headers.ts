import type { AuthConfig } from "./v1.47/generated/types.gen.js";

/**
 * Returns an `X-Registry-Auth` header object.
 */
export function xRegistryAuth(authConfig: AuthConfig) {
	return {
		"X-Registry-Auth": Buffer.from(JSON.stringify(authConfig))
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_"),
	};
}

/**
 * Returns an `X-Registry-Config` header object.
 */
export function xRegistryConfig(registryConfig: RegistryConfig) {
	return {
		"X-Registry-Config": Buffer.from(JSON.stringify(registryConfig)).toString(
			"base64",
		),
	};
}

export type RegistryConfig = {
	[registryUrl: string]: AuthConfig;
};
