export interface Config {
	/**
	 * Plugin name. Must be unique.
	 */
	name: "docker-modem";
	/**
	 * Name of the generated file.
	 *
	 * @default 'docker-modem'
	 */
	output?: string;
	/**
	 * A custom option for your plugin.
	 */
	modem?: boolean;
}
