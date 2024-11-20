// my-test.ts
import type Dockerode from "dockerode";
import { Wait, type StartedTestContainer } from "testcontainers";
import { test as base } from "vitest";
import type { WorkloadContainer } from "~sidecar/containers/container.js";

const startedContainers: (StartedTestContainer | Dockerode.Container)[] = [];

export const test = base.extend({
	containers: async (
		// eslint-disable-next-line no-empty-pattern
		{},
		use: (
			value: (StartedTestContainer | Dockerode.Container)[],
		) => Promise<void>,
	) => {
		startedContainers.length = 0;
		await use(startedContainers);

		for (const startedContainer of startedContainers) {
			try {
				await startedContainer.stop();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (
					e.reason !== "no such container" &&
					!e.reason.includes("already stopped")
				) {
					throw e;
				}
			}
		}
		startedContainers.length = 0;
	},
});

export async function startContainer(
	container: WorkloadContainer,
	quickStart: boolean = true,
) {
	if (quickStart) {
		container.definition = {
			...container.definition,
			healthCheck: undefined,
			waitStrategy: Wait.forLogMessage(""),
		};
	}
	return await container.start();
}
