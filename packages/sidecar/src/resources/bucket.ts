import { kebabCase } from "case-anything";
import type { GenericResource, ResourceBuilder } from "~sidecar/resources.js";

export interface BucketOptions {
	/**
	 * Bucket read access
	 *
	 * @defaultValue `private`
	 */
	access?: "private" | "public";
	/**
	 * Retain bucket
	 *
	 * @defaultValue `true`
	 */
	retain?: boolean;
}

/**
 * Bucket resource
 */

export class Bucket implements GenericResource, ResourceBuilder {
	constructor(
		public id: string,
		public options: BucketOptions,
	) {}

	/**
	 * Returns the build output for the resource.
	 *
	 * @hidden
	 */
	build() {
		return {
			kind: "bucket",
			id: kebabCase(this.id),
			connectionStringEnvVar: "",
		};
	}
}
