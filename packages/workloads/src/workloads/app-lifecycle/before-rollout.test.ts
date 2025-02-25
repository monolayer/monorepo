import { describe, expect, test } from "vitest";
import { BeforeRollout } from "~workloads/workloads/app-lifecycle/before-rollout.js";

describe("Before rollout workload", () => {
	test("id", () => {
		const rollout = new BeforeRollout({
			commands: ["db:seed"],
		});

		expect(rollout.id).toEqual("before-rollout");
	});

	test("command list", () => {
		const rollout = new BeforeRollout({
			commands: ["db:seed", "some:script"],
		});

		expect(rollout.commands).toStrictEqual(["db:seed", "some:script"]);
	});
});
