import fs from "fs";
import path from "path";
import { cwd } from "process";
import type { ViteDevServer } from "vite";
import { type ExecaCommandResult, runCommand } from "./cli/command.js";
import { type Config } from "./config.js";

class FileLock {
	constructor(private path: string) {}

	lock() {
		fs.writeFileSync(this.path, "");
	}

	locked() {
		try {
			fs.accessSync(this.path, fs.constants.F_OK);
			return true;
		} catch (error) {
			return false;
		}
	}
}

export class AutoPilot {
	private static instance: AutoPilot;

	#on: boolean;
	queue: boolean[] = [];
	fileLock: FileLock;

	constructor() {
		this.#on = false;
		this.fileLock = new FileLock(
			path.join(cwd(), ".kinetic", "autopilot.lock"),
		);
	}

	public static getInstance(): AutoPilot {
		if (!AutoPilot.instance) {
			AutoPilot.instance = new AutoPilot();
		}
		return AutoPilot.instance;
	}

	get active() {
		return this.#on;
	}

	start() {
		this.#on = true;
		this.fileLock.lock();
	}

	async run(path: string, callback: (result: ExecaCommandResult) => void) {
		if (this.queue.length < 2) {
			this.queue.push(true);
		}
		if (this.queue.length > 1) {
			return;
		}
		while (this.queue.length > 0) {
			await this.delay();
			const result = await runCommand("npx", ["kinetic-autopilot"]);
			callback(result);
			this.queue.shift();
		}
	}

	async delay() {
		new Promise((resolve) => setTimeout(resolve, 1500));
	}

	hasLock() {
		return this.fileLock.locked();
	}
}

function createAutoPilotDir() {
	const dir = path.join(cwd(), ".kinetic", "autopilot");
	try {
		fs.accessSync(dir, fs.constants.F_OK);
	} catch (error) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

export function kineticAutoPilot(config: Config) {
	createAutoPilotDir();
	const autoPilot = AutoPilot.getInstance();

	if (!autoPilot.active) {
		autoPilot.start();
		return {
			name: "kinetic-auto-pilot",
			apply: "serve" as const,

			async configureServer(server: ViteDevServer) {
				console.log("Starting Kinetic Autopilot");
				server.watcher.on("all", async (_, filepath) => {
					const enabled = config.future?.unstable_auto_migrations || false;
					if (
						enabled &&
						filepath.startsWith(cwd()) &&
						!filepath.startsWith(path.join(cwd(), ".kinetic"))
					) {
						autoPilot.run(filepath, (result) => {
							if (result.success) {
								console.log(result.value.stdout);
							} else {
								console.dir(result, { depth: null });
							}
						});
					}
				});
			},
		};
	}
	return {
		name: "kinetic-auto-pilot",
		async configureServer() {},
	};
}
