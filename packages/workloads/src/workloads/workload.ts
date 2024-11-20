import {
	defaultDevStartOptions,
	defaultTestStartOptions,
	type ContainerOverrides,
	type StartOptions,
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

	public containerOptions(
		/**
		 * Container Options
		 */
		options: {
			/**
			 * Docker image name
			 */
			imageName?: string;
			/**
			 * Container start options
			 */
			startOptions?: StartOptions;
		},
	) {
		this.containerOverrides = {
			definition: { containerImage: options.imageName },
			startOptions: options.startOptions ?? {},
		};
		return this;
	}

	/**
	 * @hidden
	 */
	mode(mode: "dev" | "test") {
		const current = this.containerOverrides;
		this.containerOptions({
			startOptions:
				mode === "dev" ? defaultDevStartOptions : defaultTestStartOptions,
		});
		if (current) {
			this.containerOptions(current);
		}
	}
}
