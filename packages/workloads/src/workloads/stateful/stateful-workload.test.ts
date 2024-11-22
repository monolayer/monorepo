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

	class TestStatefulWorkloadWithClient<
		C,
	> extends StatefulWorkloadWithClient<C> {
		get connStringComponents() {
			return ["test-stateful", this.id, "url"];
		}
	}

	test("client type", async () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const testDb = new TestStatefulWorkloadWithClient(
			"test_commands",
			(connectionStringEnvVar) => [connectionStringEnvVar],
		);
		type ClientType = typeof testDb.client;
		type ExpectedType = string[];
		const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
		expect(isEqual).toBe(true);
	});

	test("connectionStringEnvVar from components", async () => {
		const testDb = new TestStatefulWorkloadWithClient(
			"commands",
			(connectionStringEnvVar) => [connectionStringEnvVar],
		);
		expect(testDb.connectionStringEnvVar).toStrictEqual(
			"MONO_TEST_STATEFUL_COMMANDS_URL_URL",
		);
	});
});
