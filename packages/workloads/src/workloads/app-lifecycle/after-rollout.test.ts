import { describe, expect, test } from "vitest";
import { AfterRollout } from "./after-rollout.js";

describe("After rollout workload", () => {
	test("id", () => {
		const rollout = new AfterRollout("1-after-rollout", {
			script: "db:migrate",
		});

		expect(rollout.id).toEqual("1-after-rollout");
	});

	test("script", () => {
		const rollout = new AfterRollout("another-rollout", {
			script: "db:migrate",
		});

		expect(rollout.script).toStrictEqual("db:migrate");
	});
});
