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
	 * **NOTES**
	 *
	 * In development, the task will be performed immediately.
	 *
	 * In test, the task will collected ans can be retrieved with the `performedTasks` test helper.
	 */
	async performLater(data: P | P[], options?: PerformOptions) {
		return await performLater(this, data, options);
	}

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
	 * **Important**
	 *
	 * This setting does not have any effect on Tasks backed by an `SQS` queue in production.
	 *
	 * Retries will happen after the `VisibilityTimeout` of the message expires (30 seconds by default).
	 * See: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html#consumer-fails-to-process-message
	 *
	 * You can to implement an custom backoff strategy using a dead-letter queue to handle retries
	 * and a Lambda function.
	 *
	 * @defaultValue { type: "constant", delay: 0 }
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
