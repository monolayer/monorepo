import { assert, test } from "vitest";
import { Cron } from "~workloads/workloads/stateless/cron.js";

test("initialize on valid schedule", () => {
	const reporting = new Cron("reporting", {
		schedule: "* * * * *",
		work: () => {},
	});

	assert.strictEqual(reporting.schedule, "* * * * *");
});

test("run task", () => {
	let number = 0;

	const reporting = new Cron("reporting", {
		schedule: "* * * * *",
		work: () => {
			number += 1;
		},
	});

	reporting.work();
	assert.strictEqual(number, 1);
});

test("throws on invalid schedule", () => {
	assert.throws(
		() =>
			new Cron("reporting", {
				schedule: "invalid",
				work: () => {},
			}),
		"Failed to parse schedule: invalid",
	);
});
