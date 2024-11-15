export interface ResourceBuildOutput {
	/**
	 * Resource type
	 */
	kind: string;
	/**
	 * Resource ID
	 */
	id: string;
	/**
	 * Environment variable name for the connection string;
	 */
	connectionStringEnvVar: string;
}

export interface ResourceBuild {
	/**
	 * Returns a {@link ResourceBuildOutput}
	 */
	build: () => ResourceBuildOutput;
}
