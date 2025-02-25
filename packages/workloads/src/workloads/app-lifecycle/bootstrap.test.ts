import { describe, expect, test } from "vitest";
import { Bootstrap } from "~workloads/workloads/app-lifecycle/bootstrap.js";

describe("Bootstrap workload", () => {
	test("id", () => {
		const rollout = new Bootstrap({
			commands: ["db:seed"],
		});

		expect(rollout.id).toEqual("bootstrap");
	});

	test("command list", () => {
		const rollout = new Bootstrap({
			commands: ["db:seed", "some:script"],
		});

		expect(rollout.commands).toStrictEqual(["db:seed", "some:script"]);
	});
});
