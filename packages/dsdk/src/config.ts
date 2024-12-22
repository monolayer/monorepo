/* eslint-disable no-useless-catch */
import type DockerModem from "docker-modem";
import Docker from "docker-modem";
import { exec as childExec } from "node:child_process";
import path from "node:path";

/**
 * Sets the connection credentials from an existing Docker context.
 */
export async function setContext(contextName: string) {
	const config = await configFromContext(contextName);
	const docker = new Docker(config);
	ModemContext.instance().docker = docker;
}

/**
 * Use the connection credentials from an existing Docker context
 * when running the callback function.
 */
export async function withContext(
	contextName: string,
	callback: () => void | Promise<void>,
) {
	const currentDocker = ModemContext.instance().docker;
	try {
		const config = await configFromContext(contextName);
		const docker = new Docker(config);
		ModemContext.instance().docker = docker;
		await callback();
	} catch (e) {
		throw e;
	} finally {
		ModemContext.instance().docker = currentDocker;
	}
}

async function configFromContext(name: string) {
	const context = await inspectContext(name);
	const host = context.Endpoints["docker"].Host;
	const url = new URL(host);
	return {
		...(url.protocol === "unix:"
			? { socketPath: url.pathname }
			: {
					host: url.host,
					username: url.username,
					protocol: url.protocol.replace(/:$/, ""),
				}),
		sshOptions: { agent: process.env.SSH_AUTH_SOCK ?? "" },
		ca: tlsPath("ca", context),
		cert: tlsPath("cert", context),
		key: tlsPath("key", context),
	} as DockerModem.ConstructorOptions;
}

async function inspectContext(name: string) {
	if ((await listContexts()).some((c) => c.Name === name) === false) {
		throw new Error(`Context ${name} not found`);
	}
	const { stdout } = await exec(`docker context inspect ${name} --format json`);
	const parsed = JSON.parse(stdout) as ContextInspect[];
	return parsed[0]!;
}

async function listContexts(): Promise<Context[]> {
	const { stdout } = await exec("docker context ls --format json");
	return JSON.parse(
		`[${stdout
			.split("\n")
			.filter((l) => l !== "")
			.join(",")}]`,
	);
}

function tlsPath(kind: "ca" | "cert" | "key", context: ContextInspect) {
	let idx: number;
	switch (kind) {
		case "ca":
			idx = 0;
			break;
		case "cert":
			idx = 1;
			break;
		case "key":
			idx = 2;
			break;
	}
	if (context.TLSMaterial["docker"]) {
		const fileName = context.TLSMaterial["docker"][idx];
		if (fileName) {
			return path.join(context.Storage.TLSPath, "docker", fileName);
		}
	}
}

interface Context {
	Name: string;
	Description: string;
	Current: boolean;
	Error: string;
	ContextType: string;
}

interface ContextInspect {
	Name: string;
	Metadata: unknown;
	Endpoints: {
		docker: {
			Host: string;
			SkipTLSVerify: boolean;
		};
	};
	TLSMaterial: Record<string, Array<string>>;
	Storage: {
		MetadataPath: string;
		TLSPath: string;
	};
}

/**
 * @hidden
 *
 * @internal
 */
export class ModemContext {
	static #instance: ModemContext;
	docker: Docker | undefined;
	static instance() {
		if (this.#instance === undefined) {
			this.#instance = new ModemContext();
		}
		return this.#instance;
	}
	private constructor() {}
}

async function exec(command: string) {
	return new Promise<{ stdout: string; stderr: string }>((resolve) => {
		childExec(command, (error, stdout, stderr) => {
			if (error) {
				throw error;
			}
			resolve({ stdout, stderr });
		});
	});
}
