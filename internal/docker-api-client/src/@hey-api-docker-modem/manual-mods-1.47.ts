/**
 * Describes a permission the user has to accept upon installing
 * the plugin.
 *
 */
export type PluginPrivilege = {
	Name?: string;
	Description?: string;
	Value?: Array<string>;
};

export type PluginSetData = {
	path: {
		/**
		 * The name of the plugin. The `:latest` tag is optional, and is the
		 * default if omitted.
		 *
		 */
		name: string;
	};
	body: Array<{
		[key: string]: string;
	}>;
};

export type ImageCreateData = {
	headers?: {
		/**
		 * A base64url-encoded auth configuration.
		 *
		 * Refer to the [authentication section](#section/Authentication) for
		 * details.
		 *
		 */
		"X-Registry-Auth"?: string;
	};
	query?: {
		/**
		 * Apply `Dockerfile` instructions to the image that is created,
		 * for example: `changes=ENV DEBUG=true`.
		 * Note that `ENV DEBUG=true` should be URI component encoded.
		 *
		 * Supported `Dockerfile` instructions:
		 * `CMD`|`ENTRYPOINT`|`ENV`|`EXPOSE`|`ONBUILD`|`USER`|`VOLUME`|`WORKDIR`
		 *
		 */
		changes?: Array<string>;
		/**
		 * Name of the image to pull. The name may include a tag or digest. This parameter may only be used when pulling an image. The pull is cancelled if the HTTP connection is closed.
		 */
		fromImage?: string;
		/**
		 * Source to import. The value may be a URL from which the image can be retrieved or `-` to read the image from the request body. This parameter may only be used when importing an image.
		 */
		fromSrc?: string;
		/**
		 * Set commit message for imported image.
		 */
		message?: string;
		/**
		 * Platform in the format os[/arch[/variant]].
		 *
		 * When used in combination with the `fromImage` option, the daemon checks
		 * if the given image is present in the local image cache with the given
		 * OS and Architecture, and otherwise attempts to pull the image. If the
		 * option is not set, the host's native OS and Architecture are used.
		 * If the given image does not exist in the local image cache, the daemon
		 * attempts to pull the image with the host's native OS and Architecture.
		 * If the given image does exists in the local image cache, but its OS or
		 * architecture does not match, a warning is produced.
		 *
		 * When used with the `fromSrc` option to import an image from an archive,
		 * this option sets the platform information for the imported image. If
		 * the option is not set, the host's native OS and Architecture are used
		 * for the imported image.
		 *
		 */
		platform?: string;
		/**
		 * Repository name given to an image when it is imported. The repo may include a tag. This parameter may only be used when importing an image.
		 */
		repo?: string;
		/**
		 * Tag or digest. If empty when pulling an image, this causes all tags for the given image to be pulled.
		 */
		tag?: string;
	};
	body?: {
		/**
		 * Image content if the value \`-\` has been specified in fromSrc query parameter
		 */
		inputImage?: Buffer | string;
	};
};

export type ImageLoadData = {
	query?: {
		/**
		 * Suppress progress details during load.
		 */
		quiet?: boolean;
	};
	body: {
		/**
		 * Tar archive containing images
		 */
		imagesTarball: Buffer;
	};
};

export type PluginPullData = {
	headers?: {
		/**
		 * A base64url-encoded auth configuration to use when pulling a plugin
		 * from a registry.
		 *
		 * Refer to the [authentication section](#section/Authentication) for
		 * details.
		 *
		 */
		"X-Registry-Auth"?: string;
	};
	query: {
		/**
		 * Local name for the pulled plugin.
		 *
		 * The `:latest` tag is optional, and is used as the default if omitted.
		 *
		 */
		name?: string;
		/**
		 * Remote reference for plugin to install.
		 *
		 * The `:latest` tag is optional, and is used as the default if omitted.
		 *
		 */
		remote: string;
	};
	body: Array<PluginPrivilege>;
};

export type PluginCreateData = {
	query: {
		/**
		 * The name of the plugin. The `:latest` tag is optional, and is the
		 * default if omitted.
		 *
		 */
		name: string;
	};
	body: {
		/**
		 * Path to tar containing plugin rootfs and manifest
		 */
		tarContext: Buffer;
	};
};

export type PluginUpgradeData = {
	headers?: {
		/**
		 * A base64url-encoded auth configuration to use when pulling a plugin
		 * from a registry.
		 *
		 * Refer to the [authentication section](#section/Authentication) for
		 * details.
		 *
		 */
		"X-Registry-Auth"?: string;
	};
	path: {
		/**
		 * The name of the plugin. The `:latest` tag is optional, and is the
		 * default if omitted.
		 *
		 */
		name: string;
	};
	query: {
		/**
		 * Remote reference to upgrade to.
		 *
		 * The `:latest` tag is optional, and is used as the default if omitted.
		 *
		 */
		remote: string;
	};
	body: Array<PluginPrivilege>;
};
