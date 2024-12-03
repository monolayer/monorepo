import { Worker as BullWorker } from "bullmq";
import { computeBackoff } from "~workloads/workloads/stateless/task/backoffs.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";

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

	async stop() {
		this.close();
	}
}
