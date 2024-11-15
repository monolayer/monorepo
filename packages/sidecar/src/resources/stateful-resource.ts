export interface StatefulResource {
	/**
	 * Unique ID
	 */
	readonly id: string;

	/**
	 * Container Docker image name
	 */
	readonly containerImageName: string;
	/**
	 * Container Docker image tag
	 */
	containerImageTag: string;
}
