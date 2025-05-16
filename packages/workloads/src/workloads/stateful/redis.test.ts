import { expect } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

test("Redis is a StatefulWorkloadWithClient", () => {
	expect(Redis.prototype).toBeInstanceOf(StatefulWorkloadWithClient);
});

test("connStringComponents", async () => {
	const redis = new Redis("products");
	expect(redis.connStringComponents).toStrictEqual(["redis", "products"]);
});
