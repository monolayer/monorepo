import { writeFileSync } from "fs";

export class DockerfileWriter {
	#lines: string[] = [];

	/**
	 * Instruction that initializes a new build stage and sets the base image for
	 * subsequent instructions.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#from)
	 */
	FROM(
		/**
		 * Image name.
		 *
		 * Formats: `<image>`, `<image>[:<tag>]`, `<image>[@<digest>]`
		 */
		image: string,
		options?: {
			/**
			 * Build stage name.
			 */
			as?: string;
			/**
			 * Platform of the image in case `FROM` references a multi-platform image.
			 */
			platform?: string;
		},
	) {
		const platform = options?.platform
			? `--platform=${options?.platform}`
			: undefined;
		const as = options?.as ? `AS ${options.as}` : undefined;

		this.#pushInstruction(
			["FROM", platform, image, as].filter((p) => p !== undefined).join(" "),
		);
		return this;
	}

	/**
	 * Sets the environment variable <key> to the value <value>.
	 * This value will be in the environment for all subsequent instructions
	 * in the build stage.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#env)
	 */
	ENV(key: string, value: string) {
		this.#pushInstruction(`ENV ${key}="${value}"`);
		return this;
	}

	/**
	 * Sets the working directory for any `RUN`, `CMD`, `ENTRYPOINT`, `COPY` and `ADD` instructions
	 * that follow it in the Dockerfile.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#workdir)
	 */
	WORKDIR(dir: string) {
		this.#pushInstruction(`WORKDIR ${dir}`);
		return this;
	}

	/**
	 * Execute any commands to create a new layer on top of the current image.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#run)
	 */
	RUN(
		command: string | string[],
		options?: {
			/**
			 * Create filesystem mounts that the build can access. This can be used to:
			 * - Create bind mount to the host filesystem or other build stages.
			 * - Access build secrets or ssh-agent sockets.
			 * - Use a persistent package management cache to speed up your build.
			 */
			mount?: MountType | MountType[];
			/**
			 * Control over which networking environment the command is run in.
			 */
			network?: "default" | "none" | "host";
		},
	) {
		let base = "RUN";
		if (options?.mount) {
			base += ` ${mountOpts(options?.mount)}${Array.isArray(command) ? "" : " \\\n   "}`;
		}
		const instruction = `${base} ${
			Array.isArray(command) ? ["<<EOF", ...command, "EOF"].join("\n") : command
		}`;
		this.#pushInstruction(instruction);
		return this;
	}

	/**
	 * Copies new files or directories from <src> and adds them to the filesystem of the image
	 * at the path <dest>. Files and directories can be copied from the build context,
	 * build stage, named context, or an image.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#copy)
	 */
	COPY(source: string | string[], destination: string, options?: CopyOptions) {
		const base =
			options === undefined ? "COPY" : `COPY ${optionsToString(options)}`;
		this.#pushInstruction(
			`${base} ${[source]
				.flatMap((s) => s)
				.map((s) => (s.includes(" ") ? `"${s}"` : s))
				.join(
					" ",
				)} ${destination.includes(" ") ? `"${destination}"` : destination}`,
		);
		return this;
	}

	/**
	 * Sets the command to be executed when running a container from an image.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#cmd)
	 */
	CMD(params?: string[]): this;
	CMD(executable: string, params?: string[]): this;
	CMD(...args: unknown[]) {
		this.#pushInstruction(
			`CMD [${args
				.flatMap((e) => e)
				.map((e) => `"${e}"`)
				.join(", ")}]`,
		);
		return this;
	}

	/**
	 * Configures a container that will run as an executable.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#entrypoint)
	 */
	ENTRYPOINT(executable: string, parameters?: string[]) {
		this.#pushInstruction(
			`ENTRYPOINT [${[executable, ...(parameters ?? [])].map((e) => `"${e}"`).join(", ")}]`,
		);
		return this;
	}

	/**
	 * Overrides the default shell used for the shell form of commands.
	 *
	 * The default shell on Linux is `["/bin/sh", "-c"]`,
	 * and on Windows is `["cmd", "/S", "/C"]`.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#shell)
	 */
	SHELL(executable: string, parameters: string[]) {
		this.#pushInstruction(
			`SHELL [${[executable, ...(parameters ?? [])].map((e) => `"${e}"`).join(", ")}]`,
		);
		return this;
	}

	/**
	 * Informs Docker that the container listens on the specified network ports at runtime.
	 *
	 * You can specify whether the port listens on TCP or UDP,
	 * and the default is TCP if you don't specify a protocol.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#expose)
	 */
	EXPOSE(port: number | { port: number; protocol: "tcp" | "udp" }) {
		if (typeof port === "number") {
			this.#pushInstruction(`EXPOSE ${port}`);
		} else {
			this.#pushInstruction(`EXPOSE ${port.port}/${port.protocol}`);
		}
		return this;
	}

	/**
	 * Sets the user name (or UID) and optionally the user group (or GID) to use
	 * as the default user and group for the remainder of the current stage.
	 *
	 * The specified user is used for RUN instructions and at runtime,
	 * runs the relevant `ENTRYPOINT` and `CMD` commands.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#user)
	 */
	USER(name: number, group?: number): this;
	USER(name: string, group?: string): this;
	USER(...args: unknown[]) {
		const user = args.filter((p) => p !== undefined).join(":");
		this.#pushInstruction(`USER ${user}`);
		return this;
	}

	/**
	 * Creates a mount point with the specified name and
	 * marks it as holding externally mounted volumes from native host or other containers.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#volume)
	 */
	VOLUME(...names: string[]) {
		const volumes = names.map((v) => `"${v}"`).join(", ");
		this.#pushInstruction(`VOLUME [${volumes}]`);
		return this;
	}

	/**
	 * Sets the system call signal that will be sent to the container to exit.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#stopsignal)
	 */
	STOPSIGNAL(signal: NodeJS.Signals | number) {
		this.#pushInstruction(`STOPSIGNAL ${signal}`);
		return this;
	}

	/**
	 * Defines a variable that users can pass at build-time to the builder
	 * with the docker build command using the `--build-arg <varname>=<value>` flag.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#arg)
	 */
	ARG(name: string, defaultValue?: string) {
		this.#pushInstruction(
			`ARG ${[name, defaultValue].filter((c) => c !== undefined).join("=")}`,
		);
		return this;
	}

	/**
	 * Copies new files or directories from <src> and adds them to the filesystem
	 * of the image at the path <dest>.
	 *
	 * Files and directories can be copied from the build context,
	 * a remote URL, or a Git repository.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#add)
	 */
	ADD(source: string | string[], destination: string, options?: AddOptions) {
		const base =
			options === undefined ? "ADD" : `ADD ${optionsToString(options)}`;
		this.#pushInstruction(
			`${base} ${[source]
				.flatMap((s) => s)
				.map((s) => (s.includes(" ") ? `"${s}"` : s))
				.join(
					" ",
				)} ${destination.includes(" ") ? `"${destination}"` : destination}`,
		);
		return this;
	}

	/**
	 * Tells Docker how to test a container to check that it's still working.
	 *
	 * @see
	 *
	 * [Docker Docs](https://docs.docker.com/engine/reference/builder/#healthcheck)
	 */
	HEALTHCHECK(command: "NONE"): this;
	HEALTHCHECK(command: string, options?: HealthCheckOptions): this;
	HEALTHCHECK(command: string, options?: HealthCheckOptions) {
		switch (command) {
			case "NONE":
				this.#pushInstruction(`HEALTHCHECK NONE`);
				break;
			default:
				if (options) {
					this.#pushInstruction(
						`HEALTHCHECK ${optionsToString(options)} CMD ${command}`,
					);
				} else {
					this.#pushInstruction(`HEALTHCHECK CMD ${command}`);
				}
		}
		return this;
	}

	/**
	 * Adds a comment.
	 */
	comment(content: string) {
		this.#lines.push(`# ${content}`);
		return this;
	}

	/**
	 * Adds a banner comment
	 */
	banner(content: string) {
		this.#lines.push(`# ---------`);
		this.#lines.push(`# ${content}`);
		this.#lines.push(`# ---------`);
		this.blank();
		return this;
	}

	/**
	 * Adds an empty line.
	 */
	blank() {
		this.#lines.push("");
		return this;
	}

	/**
	 * Groups instructions by omitting blank lines between them.
	 */
	group(callback: () => void) {
		this.#blankAfterInstruction = false;
		callback();
		this.blank();
		this.#blankAfterInstruction = true;
		return this;
	}

	/**
	 * Returns the Dockerfile string with all instructions in the creation order.
	 */
	print() {
		return this.#lines.join("\n");
	}

	/**
	 * Saves the Dockerfile.
	 */
	save(filePath: string) {
		writeFileSync(filePath, this.print());
	}

	#blankAfterInstruction: boolean = true;
	/**
	 * Adds an instruction
	 */
	#pushInstruction(instruction: string) {
		this.#lines.push(`${instruction}`);
		if (this.#blankAfterInstruction) {
			this.blank();
		}
	}
}

export type MountType =
	| BindMountType
	| CacheMountType
	| TmpfsMountType
	| SecretMountType
	| SshMountType;

/**
 * This mount type allows binding files or directories to the build container.
 * A bind mount is read-only by default.
 */
export interface BindMountType {
	type: "bind";
	/**
	 * Mount path.
	 */
	target: string;
	/**
	 * Source path in the from.
	 *
	 * @defaultValue root of {@link BindMountType.from | from }
	 */
	source?: string;
	/**
	 * Build stage, context, or image name for the root of the source.
	 *
	 * @defaultValue build context.
	 */
	from?: string;
	/**
	 * Allow writes on the mount. Written data will be discarded.
	 */
	readwrite?: true;
}

/**
 * This mount type allows the build container to cache directories
 * for compilers and package managers.
 */
export interface CacheMountType {
	type: "cache";
	/**
	 * ID to identify separate/different caches.
	 *
	 * @defaultValue value of {@link CacheMountType.target | target}
	 */
	id?: string;
	/**
	 * Mount path.
	 */
	target: string;

	/**
	 * Read-only if set.
	 */
	readonly?: string;

	/**
	 * A shared cache mount can be used concurrently by multiple writers.
	 *
	 * - `private` creates a new mount if there are multiple writers.
	 * - `locked` pauses the second writer until the first one releases the mount.
	 *
	 * @defaultValue shared.
	 */
	sharing?: "shared" | "private" | "locked";

	/**
	 * Build stage, context, or image name to use as a base of the cache mount.
	 *
	 * @defaultValue empty directory.
	 */
	from?: string;

	/**
	 * Subpath in the `from` to mount.
	 *
	 * @defaultValue root of {@link CacheMountType.from | from}
	 */
	source?: string;

	/**
	 * File mode for new cache directory in octal.
	 *
	 * @defaultValue 0755
	 */
	mode?: string;

	/**
	 * User ID for new cache directory.
	 *
	 * @defaultValue 0
	 */
	uid?: string;

	/**
	 * Group ID for new cache directory.
	 *
	 * @defaultValue 0
	 */
	gid?: string;
}

/**
 * Mount type that allows mounting tmpfs in the build container.
 */
export interface TmpfsMountType {
	type: "tmpfs";
	/**
	 * Mount path.
	 */
	target: string;

	/**
	 * Specify an upper limit on the size of the filesystem.
	 */
	size?: string;
}

/**
 * This mount type allows the build container to access secret values,
 * such as tokens or private keys, without baking them into the image.
 *
 * By default, the secret is mounted as a file.
 *
 * You can also mount the secret as an environment variable by setting the env option.
 */
export interface SecretMountType {
	type: "secret";
	/**
	 * ID of the secret.
	 *
	 * @defaultValue basename of {@link SecretMountType.target | target }
	 */
	id?: string;
	/**
	 * Mount the secret to the specified path.
	 *
	 * @defaultValue /run/secrets/${id} if unset and if env is also unset
	 */
	target?: string;
	/**
	 * Mount the secret to an environment variable instead of a file, or both.
	 *
	 * @since Dockerfile v1.10.0
	 */
	env?: string;
	/**
	 * 	If set to true, the instruction errors out when the secret is unavailable.
	 *
	 * @defaultValue false
	 */
	required?: boolean;
	/**
	 * File mode for secret file in octal.
	 *
	 * @defaultValue 0400
	 */
	mode?: string;
	/**
	 * User ID for secret file.
	 *
	 * @defaultValue 0
	 */
	uid?: string;
	/**
	 * Group ID for secret file.
	 *
	 * @defaultValue 0
	 */
	gid?: string;
}

export interface SshMountType {
	type: "ssh";
	/**
	 * ID of SSH agent socket or key.
	 *
	 * @defaultValue default
	 */
	id?: string;
	/**
	 * SSH agent socket path.
	 *
	 * @defaultValue /run/buildkit/ssh_agent.${N}
	 */
	target?: string;
	/**
	 * If set to true, the instruction errors out when the key is unavailable.
	 *
	 * @defaultValue false.
	 */
	required?: string;
	/**
	 * File mode for socket in octal.
	 *
	 * @defaultValue 0600
	 */
	mode?: string;
	/**
	 * User ID for socket.
	 *
	 * @defaultValue 0.
	 */
	uid?: string;
	/**
	 * Group ID for socket.
	 *
	 * @defaultValue 0
	 */
	gid?: string;
}

function mountOpts(mount?: MountType | MountType[]) {
	if (mount === undefined) {
		return "";
	}
	return [mount]
		.flatMap((m) => m)
		.map((m) =>
			Object.entries(m)
				.reduce<string[]>(
					(acc, val) => {
						if (val[0] === "type") {
							return acc;
						}
						if (typeof val[1] === "string") {
							acc.push(`${val[0]}=${val[1]}`);
						} else {
							acc.push(val[0]);
						}
						return acc;
					},
					[`--mount=type=${m.type}`],
				)
				.join(","),
		)
		.join(" \\\n    ");
}

export interface SharedCopyAddOptions {
	/**
	 * Owner of the copied content: username, groupname, or UID/GID combination.
	 */
	chown?: string;
	/**
	 * Permission bits of the copied content
	 *
	 * @since Dockerfile v1.2
	 */
	chmod?: string;
	/**
	 * Copy files that remain independent on their own layer and don't get invalidated
	 * when commands on previous layers are changed.
	 *
	 * Source files are copied into an empty destination directory.
	 * That directory is turned into a layer that is linked on top of your previous state.
	 *
	 * @since Dockerfile v1.4
	 */
	link?: boolean;
}

export interface CopyOptions extends SharedCopyAddOptions {
	/**
	 * Copy files from an image, a build stage, or a named context.
	 */
	from?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function optionsToString(opts?: Record<string, any>) {
	if (opts === undefined) {
		return "";
	}
	return Object.entries(opts)
		.reduce<string>((acc, val) => {
			if (typeof val[1] === "boolean") {
				acc += `--${val[0]} `;
			} else {
				acc += `--${val[0]}=${val[1]} `;
			}
			return acc;
		}, "")
		.trimEnd();
}

export interface AddOptions extends SharedCopyAddOptions {
	/**
	 * Preserve the .git directory when `<src>` is the
	 * HTTP or SSH address of a remote Git repository.
	 *
	 * @since Dockerfile v1.1
	 */
	keepGitDir?: boolean;
	/**
	 * Cerify the checksum of a remote resource.
	 *
	 * The checksum is formatted as `<algorithm>:<hash>`.
	 *
	 * The supported algorithms are sha256, sha384, and sha512.
	 * @since Dockerfile v1.6
	 */
	checksum?: `${"sha256" | "sha384" | "sha512"}:${string}`;
}

/**
 * A string in the form of {value}{unit}.
 * The supported units are us (microseconds), ms (milliseconds), s (seconds),
 * m (minutes) and h (hours). Values can combine multiple values without separator.
 *
 * Examples:
 * - `10ms`
 * - `40s`
 * - `1m30s`
 * - `1h5m30s20ms`
 */
type Duration = string;

export interface HealthCheckOptions {
	/**
	 * The health check will first run interval seconds after the container is started,
	 * and then again interval seconds after each previous check completes.
	 *
	 * @defaultValue 30s
	 */
	interval?: Duration;
	/**
	 *
	 * Timeout in seconds after a single run of the check is considered to have failed.
	 *
	 * @defaultValue 30s
	 */
	timeout?: Duration;
	/**
	 * Provides initialization time for containers that need time to bootstrap.
	 * Probe failure during that period will not be counted towards
	 * the maximum number of retries.
	 *
	 * However, if a health check succeeds during the start period, the container is considered started and all consecutive failures will be counted towards the maximum number of retries.
	 *
	 * @defaultValue 0s
	 */
	startPeriod?: Duration;
	/**
	 * Time between health checks during the start period.
	 *
	 * @defaultValue 5s
	 * @since Docker Engine v25.0
	 */
	startInterval?: Duration;
	/**
	 * Consecutive failures of the health check for the container to be considered unhealthy.
	 *
	 * @defaultValue 3
	 */
	retries?: number;
}
