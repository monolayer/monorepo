import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("Mailer is a StatefulWorkloadWithClient", () => {
	expect(Mailer.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

test("connStringComponents", async () => {
	const redis = new Mailer("transactional", () => true);
	expect(redis.connStringComponents).toStrictEqual(["mailer", "transactional"]);
});
