/**
 * @typeParam C - Client type
 */
export type StatefulResourceOptions = {
	/**
	 * Unique ID.
	 */
	id: string;
};

export abstract class StatefulResource {
	/**
	 * Unique ID
	 */
	readonly id: string;

	/**
	 * Container Docker image name
	 */
	abstract readonly containerImageName: string;
	/**
	 * Container Docker image tag
	 */
	abstract containerImageTag: string;

	constructor(options: StatefulResourceOptions) {
		this.id = options.id;
	}
}
