import { Task } from "~workloads/workloads/stateless/task/task.js";
import { TaskBullWorker } from "~workloads/workloads/stateless/task/workers/bull.js";
import { TaskSingleSQSWorker } from "~workloads/workloads/stateless/task/workers/sqs-single-queue.js";
import { TaskSQSWorker } from "~workloads/workloads/stateless/task/workers/sqs.js";

export class TaskWorker<P> {
	public worker: TaskSQSWorker<P> | TaskBullWorker<P> | TaskSingleSQSWorker;

	constructor(public task: Task<P> | Task<P>[]) {
		if (process.env.MONO_TASK_MODE === undefined) {
			throw new Error(`undefined MONO_TASK_MODE environment variable`);
		}
		if (Array.isArray(this.task)) {
			switch (process.env.MONO_TASK_MODE) {
				case "sqs-single":
					this.worker = new TaskSingleSQSWorker(this.task);
					break;
				default:
					throw new Error(
						`Missing tasks worker for mode ${process.env.MONO_TASK_MODE}`,
					);
			}
		} else {
			switch (process.env.MONO_TASK_MODE) {
				case "sqs":
					this.worker = new TaskSQSWorker(this.task);
					break;
				case "bull":
					this.worker = new TaskBullWorker(this.task);
					break;
				default:
					throw new Error(
						`Missing tasks worker for mode ${process.env.MONO_TASK_MODE}`,
					);
			}
		}
	}

	async stop() {
		this.worker.stop();
	}
}
