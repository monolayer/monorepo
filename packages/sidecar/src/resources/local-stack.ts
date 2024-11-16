import { assertContainerizedResource } from "~sidecar/resources/containerized-resource.js";
import { type GenericResource } from "~sidecar/resources/interfaces.js";

/**
 * LocalStack resource.
 *
 * @private
 */
export class LocalStack implements GenericResource {
	/**
	 * Docker image for container
	 *
	 * @default `localstack/localstack:latest`
	 */
	static containerImage: string = "localstack/localstack:latest";

	readonly id: string;

	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		this.id = id;
	}
}

assertContainerizedResource(LocalStack);
