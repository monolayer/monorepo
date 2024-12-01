import { remember } from "@epic-web/remember";
import { Worker as BullWorker, Queue, type JobsOptions } from "bullmq";
import { randomUUID } from "node:crypto";
import { computeBackoff } from "~workloads/workloads/stateless/task/backoffs.js";
import type { ExecutionId } from "~workloads/workloads/stateless/task/perform-now.js";
import {
	type PerformOptions,
	type Task,
	type TaskOptions,
} from "~workloads/workloads/stateless/task/task.js";
import { validateJsonStringified } from "~workloads/workloads/stateless/task/validate-data-size.js";

export async function bullDispatch<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	validateJsonStringified(data);
	if (!Array.isArray(data)) {
		const bullJob = await bullQueue(task).add(
			task.id,
			data,
			generateJob({ perform: options, task: task.options }),
		);
		return bullJob.id as ExecutionId;
	} else {
		const bullJobs = await bullQueue(task).addBulk(
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

export const bullQueues = remember(
	"BullQueues",
	() => ({}) as Record<string, Queue>,
);

export function bullQueue<P>(task: Task<P>) {
	const queueKey = task.id as keyof typeof bullQueues;
	if (bullQueues[queueKey] !== undefined) {
		return bullQueues[queueKey];
	}
	bullQueues[queueKey] = new Queue(queueKey, {
		connection: {
			url: process.env.MONO_TASK_REDIS_URL,
		},
	});
	return bullQueues[queueKey];
}

export class TaskBullWorker<P> extends BullWorker<P> {
	constructor(task: Task<P>) {
		super(
			task.id,
			async (job) => {
				await task.work({ taskId: String(job.id), data: job.data });
			},
			{
				connection: {
					url: process.env.MONO_TASK_REDIS_URL,
				},
				removeOnComplete: { count: 0 },
				lockDuration: 30000,
				settings: {
					backoffStrategy: (attemptsMade: number) => {
						if (task.options?.retry?.backoff) {
							return computeBackoff(attemptsMade, task.options.retry.backoff);
						}
						return 0;
					},
				},
			},
		);

		this.on("error", (error) => {
			task.handleError(error);
		});
		this.on("failed", (job, error) => {
			if (job) {
				task.handleError(error, job.data, job.id!);
			}
		});
		const shutdown = async (signal: string) => {
			console.log(`Received ${signal}, closing worker...`);
			await this.close();
			process.exit(0);
		};

		process.on("SIGINT", () => shutdown("SIGINT"));
		process.on("SIGTERM", () => shutdown("SIGTERM"));
	}
}
