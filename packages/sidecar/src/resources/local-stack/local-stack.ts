import { type ContainerizedResource } from "~sidecar/resources/interfaces.js";
import { LocalStackContainer } from "~sidecar/resources/local-stack/local-stack-container.js";

/**
 * LocalStack resource.
 *
 * @private
 */
export class LocalStack implements ContainerizedResource {
	readonly id: string;
	/**
	 * @default "localstack/localstack"
	 */
	readonly containerImageName: string = "localstack/localstack";
	/**
	 * @default "latest"
	 */
	containerImageTag: string = "latest";

	/**
	 * @param id Unique ID.
	 */
	constructor(id: string) {
		this.id = id;
	}

	/**
	 * Returns a {@link LocalStackContainer}
	 *
	 * @param name container name
	 */
	container(name: string) {
		return new LocalStackContainer(this, name);
	}
}
