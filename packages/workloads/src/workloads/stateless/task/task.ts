import { kebabCase } from "case-anything";
import type {
	ConstantBackoff,
	ExponentialBackoff,
} from "~workloads/workloads/stateless/task/backoffs.js";
import { performLater } from "~workloads/workloads/stateless/task/perform-later.js";
import { performNow } from "~workloads/workloads/stateless/task/perform-now.js";
import { Workload } from "~workloads/workloads/workload.js";

export class Task<P> extends Workload {
	constructor(
		/**
		 * Name of the task.
		 */
		public name: string,
		/**
		 * Function that processes a task.
		 */
		public work: (task: { taskId: string; data: P }) => Promise<void>,
		public options?: TaskOptions<P>,
	) {
		super(kebabCase(name));
	}

	/**
	 * Performs the task immediately in the current processs.
	 */
	async performNow(data: P | P[]) {
		await performNow(this, data);
	}

	/**
	 * Performs the task later, dispatching the task to a queue.
	 *
	 * **NOTE**
	 *
	 * In development, the task will be performed immediately.
	 */
	async performLater(data: P | P[], options?: PerformOptions) {
		return await performLater(this, data, options);
	}

	/**
	 * @internal
	 */
	handleError(error?: unknown, data?: P, executionId?: string) {
		if (this.options?.onError) {
			this.options?.onError(
				new TaskError("Error while performing tasks", {
					task: this.id,
					executionId,
					data,
					error,
				}),
			);
		} else {
			console.log(
				`An error was thrown in ${this.id} and the onError callback function is undefined.`,
			);
		}
	}
}

export interface TaskOptions<P> {
	onError?: (error: TaskError<P>) => void;
	retry?: RetryOptions;
}

export class TaskError<P> extends Error {
	declare cause: TaskErrorCause<P>;

	constructor(message: string, cause: TaskErrorCause<P>) {
		super(message, { cause });
	}
}

export type TaskErrorCause<P> = {
	task: string;
	executionId?: string;
	data?: P;
	error: unknown;
};

export interface RetryOptions {
	/**
	 * The total number of attempts to try the job until it completes.
	 * @defaultValue 0
	 */
	times: number;
	/**
	 * Backoff setting for automatic retries if the job fails.
	 *
	 * @defaultValue: { type: "constant", delay: 0 }
	 */
	backoff?: ExponentialBackoff | ConstantBackoff;
}

export interface PerformOptions {
	/**
	 * Amount in milliseconds to wait until this task can be processed.
	 *
	 * @defaultValue 0
	 */
	delay?: number;
}
