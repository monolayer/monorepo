import { type JobsOptions, type Queue } from "bullmq";
import { randomUUID } from "node:crypto";
import type {
	ExecutionId,
	PerformOptions,
	Task,
	TaskOptions,
} from "src/types.js";

export async function dispatcher<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	validateJsonStringified(data);
	if (!Array.isArray(data)) {
		const bullJob = await (
			await bullQueue(task)
		).add(task.id, data, generateJob({ perform: options, task: task.options }));
		return bullJob.id as ExecutionId;
	} else {
		const bullJobs = await (
			await bullQueue(task)
		).addBulk(
			data.map((data) => ({
				name: task.id,
				data,
				opts: generateJob({ perform: options, task: task.options }),
			})),
		);
		return bullJobs.map((bullJob) => bullJob.id as ExecutionId);
	}
}

function generateJob<P>(options?: {
	perform?: PerformOptions;
	task?: TaskOptions<P>;
}) {
	return {
		jobId: randomUUID() as ExecutionId,
		delay: options?.perform?.delay ?? undefined,
		attempts: options?.task?.retry?.times ?? undefined,
		backoff: {
			type: "custom",
		},
	} satisfies JobsOptions;
}

export const bullQueues = {} as Record<string, Queue>;

async function bullQueue<P>(task: Task<P>): Promise<Queue> {
	const queueKey = task.id as keyof typeof bullQueues;
	if (bullQueues[queueKey] !== undefined) {
		return bullQueues[queueKey];
	}
	const Queue = (await import("bullmq")).Queue;
	bullQueues[queueKey] = new Queue(queueKey, {
		connection: {
			url: process.env.MONO_TASK_REDIS_URL,
		},
	});
	return bullQueues[queueKey];
}

function validateJsonStringified<P>(data: P, max: number = 256000) {
	const dataString = JSON.stringify(typeof data === "undefined" ? {} : data);
	const byteLength = Buffer.byteLength(dataString, "utf8");

	if (byteLength > max) {
		throw new Error(`Data size exceeds the limit (${max} bytes)`);
	}
}
