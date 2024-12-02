import { Task } from "~workloads/workloads/stateless/task/task.js";
import { TaskBullWorker } from "~workloads/workloads/stateless/task/workers/bull.js";
import { TaskSQSWorker } from "~workloads/workloads/stateless/task/workers/sqs.js";

export class TaskWorker<P> {
	public worker: TaskSQSWorker<P> | TaskBullWorker<P>;

	constructor(public task: Task<P>) {
		switch (process.env.MONO_TASK_MODE) {
			case "sqs":
				this.worker = new TaskSQSWorker(this.task);
				break;
			case "bull":
				this.worker = new TaskBullWorker(this.task);
				break;
			default:
				throw new Error(`undefined MONO_TASK_MODE environment variable`);
		}
	}

	async stop() {
		this.worker.stop();
	}
}
