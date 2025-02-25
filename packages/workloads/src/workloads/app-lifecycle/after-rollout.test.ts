import { describe, expect, test } from "vitest";
import { AfterRollout } from "./after-rollout.js";

describe("After rollout workload", () => {
	test("id", () => {
		const rollout = new AfterRollout({
			commands: ["db:migrate"],
		});

		expect(rollout.id).toEqual("after-rollout");
	});

	test("command list", () => {
		const rollout = new AfterRollout({
			commands: ["db:migrate", "some:script"],
		});

		expect(rollout.commands).toStrictEqual(["db:migrate", "some:script"]);
	});
});
