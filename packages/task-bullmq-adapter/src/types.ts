import type { ConstantBackoff, ExponentialBackoff } from "src/worker.js";

export type ExecutionId = string & {
	_brand: "ExecutionId";
};

export interface PerformOptions {
	/**
	 * Amount in milliseconds to wait until this task can be processed.
	 *
	 * @defaultValue 0
	 */
	delay?: number;
}

/**
 * @group Abstract Classes
 */
declare abstract class Workload {
	/**
	 * Unique ID
	 */
	readonly id: string;
	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	);
}

export declare class Task<P> extends Workload {
	/**
	 * Name of the task.
	 */
	name: string;
	/**
	 * Function that processes a task.
	 */
	work: (task: { taskId: string; data: P }) => Promise<void>;
	options?: TaskOptions<P> | undefined;
	constructor(
		/**
		 * Name of the task.
		 */
		name: string,
		/**
		 * Function that processes a task.
		 */
		work: (task: { taskId: string; data: P }) => Promise<void>,
		options?: TaskOptions<P> | undefined,
	);
	/**
	 * Performs the task immediately in the current processs.
	 */
	performNow(data: P | P[]): Promise<void>;
	/**
	 * Performs the task later, dispatching the task to a queue.
	 *
	 * **NOTES**
	 *
	 * In development, the task will be performed immediately.
	 *
	 * In test, the task will collected ans can be retrieved with the `performedTasks` test helper.
	 */
	performLater(
		data: P | P[],
		options?: PerformOptions,
	): Promise<ExecutionId | ExecutionId[]>;

	handleError(error?: unknown, data?: P, executionId?: string): void;
}
export interface TaskOptions<P> {
	onError?: (error: TaskError<P>) => void;
	retry?: RetryOptions;
}
export declare class TaskError<P> extends Error {
	cause: TaskErrorCause<P>;
	constructor(message: string, cause: TaskErrorCause<P>);
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
