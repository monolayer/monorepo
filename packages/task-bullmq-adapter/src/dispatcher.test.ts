import { Redis as IORedis } from "ioredis";
import {
	setupBullContext,
	teardownBullContext,
	type BullContext,
} from "tests/setup.js";
import { afterEach, beforeEach, expect, test } from "vitest";
import { dispatcher } from "./dispatcher.js";

beforeEach<BullContext<{ hello: string }>>(async (context) => {
	await setupBullContext(context);
});

afterEach<BullContext<{ hello: string }>>(async (context) => {
	await teardownBullContext(context);
});

test<BullContext<{ hello: string }>>(
	"sends task to queue",
	{ sequential: true, concurrent: false },
	async (context) => {
		await dispatcher(context.testTask, { hello: "world" });

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(1);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" });
		}
	},
);

test<BullContext<{ hello: string }>>(
	"sends task to queue with delay",
	{ sequential: true, concurrent: false },
	async (context) => {
		await dispatcher(context.testTask, { hello: "world" }, { delay: 2000 });

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(1);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" }, 2000);
		}
	},
);

test<BullContext<{ hello: string }>>(
	"sends tasks in bulk to queue",
	{ sequential: true, concurrent: false },
	async (context) => {
		await dispatcher(context.testTask, [
			{ hello: "world" },
			{ hello: "world" },
			{ hello: "world" },
		]);

		const jobKeys = await jobKeysInRedis(context.client);

		expect(jobKeys.length).toBe(3);

		for (const key of jobKeys) {
			await assertBullJob(context.client, key, { hello: "world" });
		}
	},
);

export async function jobKeysInRedis(client: IORedis) {
	const allKeys = await client.scan(0, "MATCH", "*");

	const taskKeys = (allKeys[1] ?? []).filter((key) =>
		key.match(/:\w+-\w+-\w+-\w+-\w+/),
	);
	return taskKeys;
}

async function assertBullJob(
	client: IORedis,
	key: string,
	data: Record<string, string>,
	delay: number = 0,
) {
	const result = await client.hgetall(key);
	expect(result.name).toStrictEqual("send-emails");
	expect(result.priority).toStrictEqual("0");
	expect(JSON.parse(result.data ?? "")).toStrictEqual(data);
	expect(result.delay).toStrictEqual(String(delay));
	const opts = JSON.parse(result.opts ?? "");
	const jobId = key.match(/:(\w+-\w+-\w+-\w+-\w+)/)![1];
	expect(opts.jobId).toStrictEqual(jobId);
	expect(opts.backoff).toStrictEqual({ type: "custom" });
}
