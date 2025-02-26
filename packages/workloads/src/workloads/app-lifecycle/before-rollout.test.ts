import { describe, expect, test } from "vitest";
import { BeforeRollout } from "~workloads/workloads/app-lifecycle/before-rollout.js";

describe("Before rollout workload", () => {
	test("id", () => {
		const rollout = new BeforeRollout("before-1", {
			script: "db:seed",
		});

		expect(rollout.id).toEqual("before-1");
	});

	test("command list", () => {
		const rollout = new BeforeRollout("another", {
			script: "db:seed",
		});

		expect(rollout.script).toStrictEqual("db:seed");
	});
});
