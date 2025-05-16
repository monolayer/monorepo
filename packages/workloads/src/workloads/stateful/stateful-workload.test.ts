import type { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import {
	StatefulWorkload,
	StatefulWorkloadWithClient,
} from "~workloads/workloads/stateful/stateful-workload.js";

test("StatefulWorkload flag", () => {
	class TestStatefulWorkload extends StatefulWorkload {}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const testInstance = new TestStatefulWorkload("one");

	type StatefulType = typeof testInstance.stateful;
	const isEqual: Expect<Equal<StatefulType, true>> = true;
	expect(isEqual).toBe(true);
});

describe("StatefulWorkloadWithClient", () => {
	test("is a StatefulWorkload", () => {
		expect(StatefulWorkloadWithClient.prototype).toBeInstanceOf(
			StatefulWorkload,
		);
	});

	class TestStatefulWorkloadWithClient extends StatefulWorkloadWithClient {
		get connStringComponents() {
			return ["test-stateful", this.id, "url"];
		}
	}

	test("connectionStringEnvVar from components", async () => {
		const testDb = new TestStatefulWorkloadWithClient("commands");
		expect(testDb.connectionStringEnvVar).toStrictEqual(
			"MONO_TEST_STATEFUL_COMMANDS_URL_URL",
		);
	});
});
