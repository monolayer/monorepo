import {
	ChangeMessageVisibilityCommand,
	type Message,
} from "@aws-sdk/client-sqs";
import { snakeCase } from "case-anything";
import { SQSClient } from "./client.js";
import type { Task } from "./types.js";

export class Worker<P> {
	#client: SQSClient;
	#abortController?: AbortController;
	#queueUrl: string;

	constructor(public task: Task<P>) {
		this.#client = new SQSClient();
		this.#queueUrl =
			process.env[
				`MONO_TASK_${snakeCase(this.task.id).toUpperCase()}_SQS_QUEUE_URL`
			]!;
		this.#abortController = new AbortController();
		this.#work();
	}

	stop() {
		this.#abortController?.abort("TaskSQSWorker has been stopped.");
		this.#abortController = undefined;
	}

	async #work() {
		if (this.#abortController === undefined) {
			return;
		}
		try {
			await this.#withReceivedMessage(async (message) => {
				await this.task.work({
					taskId: message.MessageAttributes?.executionId?.StringValue ?? "",
					data: JSON.parse(message.Body!),
				});
				await this.#client.deleteTask(this.#queueUrl, message.ReceiptHandle!);
			}, this.#abortController);
		} catch (error) {
			this.task.handleError(error);
		} finally {
			this.#work();
		}
	}

	async #withReceivedMessage(
		callback: (message: Message) => Promise<void>,
		abortController: AbortController,
	) {
		const message = await this.#client.receiveTask(this.#queueUrl, {
			visibilityTimeout: 30,
			waitTime: 10,
			abortController: abortController,
		});
		if (!message) {
			return;
		}
		let heartBeat: VisibilityHeartbeat | undefined;
		try {
			heartBeat = new VisibilityHeartbeat(this.#client, {
				queueUrl: this.#queueUrl,
				messageReceiptHandle: message.ReceiptHandle!,
				extendBy: 30000,
				abortController,
			});
			await callback(message);
		} finally {
			heartBeat?.stop();
		}
	}
}

export class VisibilityHeartbeat {
	private timeoutId: NodeJS.Timeout | undefined = undefined;

	constructor(
		private client: SQSClient,
		private options: {
			queueUrl: string;
			messageReceiptHandle: string;
			extendBy: number;
			abortController: AbortController;
		},
	) {
		this.timeoutId = setInterval(
			async () => this.#extendMessageVisibility(),
			this.options.extendBy / 2,
		);
		this.options.abortController.signal.addEventListener("abort", () =>
			this.stop(),
		);
	}

	async #extendMessageVisibility() {
		const command = new ChangeMessageVisibilityCommand({
			QueueUrl: this.options.queueUrl,
			ReceiptHandle: this.options.messageReceiptHandle,
			VisibilityTimeout: this.options.extendBy,
		});
		this.client.send(command, {
			abortSignal: this.options.abortController.signal,
		});
	}

	stop() {
		clearTimeout(this.timeoutId);
		this.timeoutId = undefined;
	}
}
