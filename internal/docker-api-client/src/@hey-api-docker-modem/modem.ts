import { stringToStatements } from "./utils.js";

export const modem = stringToStatements(`\
import stream from "node:stream";
import { type DialOptions } from "docker-modem";
import { pino } from "pino";
import { ModemContext } from "./../../config.js";

export const logger = pino({
	level: process.env.DEBUG ?? "silent",
	transport:
		process.env.NODE_ENV !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
					},
				}
			: undefined,
});

function logCall(options: {
	path: unknown;
	method: unknown;
	options?: unknown;
}) {
	logger.debug({
		type: "dockerApi",
		path: options.path,
		method: options.method,
		...(options.options ? { options: options.options } : {}),
	});
}

export type CallbackFn<T = unknown> = (error: unknown, result: T) => void;

export type StreamCallbackFn = (
  error: unknown,
  stdout: Buffer | null,
  stderr: Buffer | null,
) => void;

export type Options = {
	abortSignal?: AbortSignal;
};

export type ExtendedOptions<T> = Options & T;

export type ExtendedOptionsWithBody<T, B> = ExtendedOptions<T> & B;

function getModem() {
	const docker = ModemContext.instance().docker;
	if (docker === undefined) {
		throw new Error("Missing Docker context. Did you call \`setDockerContext\`?");
	}
	return docker;
}

async function promisifiedDial<T>(options: DialOptions) {
    const promise = new Promise<T>((resolve, reject) => {
        const docker = getModem();
        docker.dial(options, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data as T);
        });
    });
    return await promise;
}

function demuxedDial(
	dialOptions: DialOptions,
	callback: StreamCallbackFn,
) {
	const docker = getModem();
	const stdoutStream = new stream.PassThrough();
	const stderrStream = new stream.PassThrough();
	stdoutStream.on("data", (chunk) => {
		callback(null, chunk, null);
	});
	stderrStream.on("data", (chunk) => {
		callback(null, null, chunk);
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const demux = (error: unknown, stream: any) => {
		if (error !== null) {
			callback(error, null, null);
		} else {
			docker.demuxStream(stream, stdoutStream, stderrStream);
		}
	};
	docker.dial(dialOptions, demux);
}

function withoutBodyAndPath<
	T extends {
		body?: unknown;
		path?: unknown;
	},
>(opts: T) {
	return (({ body, path, ...rest }) => rest)(opts) as T;
}

function withoutPath<T extends { path?: unknown }>(opts: T) {
	return (({ path, ...rest }) => rest)(opts) as T;
}
`);
