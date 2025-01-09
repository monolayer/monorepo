import type { BuildManifest } from "@monolayer/workloads";
import * as pulumi from "@pulumi/pulumi";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";
import invariant from "tiny-invariant";

const deployModes = ["digitalocean-swarm" as const, "vm-swarm" as const];
export type DeployMode = (typeof deployModes)[number];

class StackConfig {
	static #instance: StackConfig;

	static instance() {
		if (this.#instance === undefined) {
			this.#instance = new StackConfig();
		}
		return this.#instance;
	}

	config: pulumi.Config;
	digitalOceanConfig: pulumi.Config;
	project: string;
	stack: string;
	app: {
		name: string;
		version: string;
		branch: string;
		root: string;
		context: string;
	};
	dockerBuildPlatforms: string[];
	buildManifest: BuildManifest;
	domain: string;
	profileName: DeployMode;
	registryUsername: pulumi.Output<string>;
	registryPassword: pulumi.Output<string>;
	retainStateOnDelete: boolean;
	sshKey: string;
	subdomain: string;
	appSubdomain: string;

	profile: VmSwarmProfile | DigitalOceanSwarmProfile;

	private constructor() {
		this.config = new pulumi.Config("workloads");
		this.digitalOceanConfig = new pulumi.Config("digitalocean");
		this.project = pulumi.getProject();
		this.stack = pulumi.getStack();
		this.dockerBuildPlatforms = this.config.requireObject<string[]>("buildplatforms");
		this.buildManifest = JSON.parse(
			readFileSync(path.join(path.join(cwd(), ".."), ".workloads/manifest.json")).toString(),
		) as BuildManifest;
		this.profileName = this.requireProfileName();
		this.retainStateOnDelete = this.config.getBoolean("retainStateOnDelete") ?? true;
		this.sshKey = this.config.require("sshKey");
		this.subdomain = this.config.require("subdomain");
		switch (this.profileName) {
			case "digitalocean-swarm":
				this.profile = digitalOceanSwarmProfile();
				break;
			case "vm-swarm":
				this.profile = vmSwarmProfile();
				break;
		}
		this.domain = this.profile.domain;
		this.registryUsername = this.profile.registry.username;
		this.registryPassword = this.profile.registry.password;
		this.app = {
			name: `${this.project}-${this.stack}`,
			version: gitVersion(path.join(cwd(), "..")),
			branch: gitBranch(path.join(cwd(), "..")),
			root: path.join(cwd(), ".."),
			context: path.join(path.join(cwd(), ".."), ".workloads/manifest.json"),
		};
		this.appSubdomain =
			this.app.branch === "main" ? this.subdomain : `${this.subdomain}-${this.app.version}`;
	}

	get vmSwarmProfile() {
		return this.profile as VmSwarmProfile;
	}

	get digitalOceanSwarmProfile() {
		return this.profile as DigitalOceanSwarmProfile;
	}

	get crons() {
		return this.buildManifest.cron;
	}

	get tasks() {
		return this.buildManifest.task;
	}

	private requireProfileName() {
		const mode: DeployMode = this.config.require("profile");
		if (deployModes.includes(mode)) {
			return mode;
		} else {
			throw new Error(`Invalid deploy mode: ${mode}`);
		}
	}

	private rUsername() {
		switch (this.profileName) {
			case "digitalocean-swarm":
				return this.digitalOceanConfig.requireSecret("token");
			case "vm-swarm":
				return this.config.requireSecret("registryUsername");
		}
	}

	private rPassword() {
		switch (this.profileName) {
			case "digitalocean-swarm":
				return this.digitalOceanConfig.requireSecret("token");
			case "vm-swarm":
				return this.config.requireSecret("registryPassword");
		}
	}

	checkEnvironmentVariables() {
		const manifest = Config.buildManifest;
		const missingVars: string[] = [];
		manifest.mailer.map((mailer) => {
			const varName = mailer.connectionStringEnvVar;
			try {
				invariant(process.env[varName]);
			} catch {
				missingVars.push(varName);
			}
		});
		if (missingVars.length !== 0) {
			throw new Error(`Missing environment variables: ${missingVars.join(",")}`);
		}
	}

	extraVars() {
		const errors: Error[] = [];

		const manifest = this.buildManifest;
		const vars = manifest.mailer.reduce<Record<string, string>>((acc, mailer) => {
			const varName = mailer.connectionStringEnvVar as keyof typeof acc;
			try {
				invariant(process.env[varName], `missing environment variable ${varName}`);
				acc[varName] = process.env[varName];
			} catch (e) {
				if (e instanceof Error) {
					errors.push(e);
				}
			}
			return acc;
		}, {});
		if (errors.length !== 0) {
			throw new AggregateError(errors, `Missing arguments: ${errors.map((e) => e.message)}`, {
				cause: errors.map((e) => e.message),
			});
		}
		if (manifest.bucket.length !== 0) {
			console.warn(
				"You have bucket workloads defined. Please make sure you have the proper credentials set up.",
			);
		}
		return vars;
	}
}

function gitVersion(appRoot: string) {
	try {
		return execSync("git rev-parse HEAD", { cwd: appRoot }).toString().trim().substring(0, 8);
	} catch {
		throw new Error("Failed to get git commit hash. Are you in a git repository?");
	}
}

function gitBranch(appRoot: string) {
	try {
		return execSync("git rev-parse --abbrev-ref HEAD", { cwd: appRoot }).toString().trim();
	} catch {
		throw new Error("Failed to get git branch.");
	}
}

export const Config = StackConfig.instance();

export function hashValue(value: string) {
	const hash = createHash("sha256");
	hash.update(value);
	return hash.digest("hex").substring(0, 6);
}

export function vmSwarmProfile() {
	const vmSwarm = new pulumi.Config("workloads");
	return {
		ipv4Address: vmSwarm.require("ipv4Address"),
		ipv4AddressPrivate: vmSwarm.require("ipv4AddressPrivate"),
		acmeEmail: vmSwarm.require("acmeEmail"),
		domain: vmSwarm.require("domain"),
		registry: {
			name: vmSwarm.require("registryName"),
			password: vmSwarm.requireSecret("registryPassword"),
			username: vmSwarm.requireSecret("registryUsername"),
			serverAddress: vmSwarm.require("registryServerAddress"),
		},
	} satisfies VmSwarmProfile as VmSwarmProfile;
}

export function digitalOceanSwarmProfile() {
	const vmSwarm = new pulumi.Config("workloads");
	return {
		region: vmSwarm.require("region"),
		vpcIpRange: vmSwarm.require("vpcIpRange"),
		workerNodes: vmSwarm.requireNumber("workerNodes"),
		domain: vmSwarm.require("domain"),
		subdomain: vmSwarm.require("subdomain"),
		registry: {
			password: vmSwarm.requireSecret("registryPassword"),
			username: vmSwarm.requireSecret("registryUsername"),
		},
	} satisfies DigitalOceanSwarmProfile as DigitalOceanSwarmProfile;
}

export interface DigitalOceanSwarmProfile {
	region: string;
	vpcIpRange: string;
	workerNodes: number;
	domain: string;
	subdomain: string;
	registry: {
		username: pulumi.Output<string>;
		password: pulumi.Output<string>;
	};
}

export interface VmSwarmProfile {
	acmeEmail: string;
	domain: string;
	ipv4Address: string;
	ipv4AddressPrivate: string;
	registry: {
		name: string;
		username: pulumi.Output<string>;
		password: pulumi.Output<string>;
		serverAddress: string;
	};
}

export function envVars(statefulCredentials: pulumi.UnwrappedArray<pulumi.Output<string[]>>) {
	return {
		Env: Object.entries({
			...{
				MONO_TASK_MODE: "bull",
			},
			...Config.extraVars,
			...statefulCredentials
				.flatMap((c) => c)
				.reduce<Record<string, string>>((acc, credential) => {
					const split = credential.split("=");
					acc[split[0]!] = split[1]!;
					return acc;
				}, {}),
		}).map((e) => `${e[0]}=${e[1]}`),
	};
}
