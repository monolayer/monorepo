import { Worker as BullWorker } from "bullmq";
import type { Task } from "src/types.js";

export class Worker<P> extends BullWorker<P> {
	constructor(task: Task<P>) {
		super(
			task.id,
			async (job) => {
				await task.work({ taskId: String(job.id), data: job.data });
			},
			{
				connection: {
					url: process.env.TASK_BULLMQ_ADAPTER_REDIS_URL,
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

	async stop() {
		this.close();
	}
}

export interface ConstantBackoff {
	type: "constant";
	delay: number;
}

export interface ExponentialBackoff {
	type: "exponential";
	delay: number;
}

export function computeBackoff(
	attemptsMade: number,
	backoff?: ExponentialBackoff | ConstantBackoff,
) {
	if (backoff !== undefined) {
		switch (backoff.type) {
			case "constant":
				return backoff.delay;
			case "exponential":
				if (backoff.delay < 0 || attemptsMade < 0) {
					throw new Error("Retry number cannot be less that 0");
				}
				return Math.round(Math.pow(2, attemptsMade) * backoff.delay);
		}
	}
	return 0;
}
