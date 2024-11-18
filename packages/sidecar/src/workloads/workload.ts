import type {
	ContainerOverrides,
	StartOptions,
} from "~sidecar/containers/container.js";

/**
 * @internal
 */
export class Workload {
	/**
	 * Unique ID
	 */
	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	) {
		this.id = id;
	}

	/**
	 * @internal
	 */
	containerOverrides?: ContainerOverrides;

	public containerOptions(options: {
		imageName?: string;
		startOptions?: StartOptions;
	}) {
		this.containerOverrides = {
			definition: { containerImage: options.imageName },
			startOptions: options.startOptions ?? {},
		};
		return this;
	}
}
