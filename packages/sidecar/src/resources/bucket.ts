import type { GenericResource } from "~sidecar/resources.js";

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
export class Bucket implements GenericResource {
	constructor(
		public id: string,
		public options: BucketOptions,
	) {}
}
