import type { GenericResource } from "~sidecar/resources.js";

/**
 * Bucket resource
 */
export class Bucket implements GenericResource {
	constructor(public id: string) {}
}
