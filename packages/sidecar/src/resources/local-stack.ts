import { type GenericResource } from "~sidecar/resources/interfaces.js";

/**
 * LocalStack resource.
 *
 * @private
 */
export class LocalStack implements GenericResource {
	readonly id: string;

	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		this.id = id;
	}
}
