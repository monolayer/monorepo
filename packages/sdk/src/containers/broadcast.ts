import type { StartedTestContainer } from "testcontainers";
import { ContainerWithURI } from "~workloads/containers/container-with-uri.js";
import type { WorkloadContainerDefinition } from "~workloads/containers/container.js";
import type { AnyBroadcast } from "~workloads/workloads/stateless/broadcast/router.js";

/**
 * Container for Broadcast
 *
 * @internal
 */
export class BroadcastContainer extends ContainerWithURI {
	constructor(workload: AnyBroadcast) {
		super(workload);
	}

	definition: WorkloadContainerDefinition = {
		containerImage: "node:22.17.0-bullseye-slim",
		portsToExpose: [9311],
		command: [
			"bash",
			"-c",
			"npm install --no-save @esbuild/linux-arm64 && npm install -g tsx && tsx watch ./node_modules/.bin/broadcast-server",
		],
		environment: {},
		workingDir: "/app",
		bindMounts: [{ source: process.cwd(), target: "/app", mode: "rw" }],
	};

	buildConnectionURI(container: StartedTestContainer) {
		const url = new URL("", "ws://localhost");
		url.hostname = container.getHost();
		url.port = container
			.getMappedPort(this.definition.portsToExpose[0]!)
			.toString();
		return url.toString();
	}
}
