// my-test.ts
import type { StartedTestContainer } from "testcontainers";
import { test as base } from "vitest";
import type { StartOptions } from "~sidecar/containers/container.js";

const startedContainers: StartedTestContainer[] = [];

export const test = base.extend({
	containers: async (
		// eslint-disable-next-line no-empty-pattern
		{},
		use: (value: StartedTestContainer[]) => Promise<void>,
	) => {
		startedContainers.length = 0;
		await use(startedContainers);

		for (const startedContainer of startedContainers) {
			await startedContainer.stop();
		}
		startedContainers.length = 0;
	},
});

export async function startContainer(container: {
	start: (options?: StartOptions) => Promise<StartedTestContainer>;
}) {
	return await container.start({
		reuse: false,
		publishToRandomPorts: true,
	});
}
