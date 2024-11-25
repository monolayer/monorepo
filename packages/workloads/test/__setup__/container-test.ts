// my-test.ts
import type Dockerode from "dockerode";
import { type StartedTestContainer } from "testcontainers";
import { test as base } from "vitest";

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
