export type ImageBuildBody = {
	/**
	 * A tar archive compressed with one of the following algorithms: identity (no compression), gzip, bzip2, xz.
	 */
	body?: Buffer;
};

export type PutContainerArchiveBody = {
	/**
	 * The input stream must be a tar archive compressed with one of the
	 * following algorithms: \`identity\` (no compression), \`gzip\`, \`bzip2\`,
	 * or \`xz\`.
	 *
	 */
	body: Buffer;
};
