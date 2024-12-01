import {
	ChangeMessageVisibilityCommand,
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SendMessageBatchCommand,
	SendMessageCommand,
	SQSClient,
	type Message,
} from "@aws-sdk/client-sqs";
import { remember } from "@epic-web/remember";
import { snakeCase } from "case-anything";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import type { ExecutionId } from "~workloads/workloads/stateless/task/perform-now.js";
import {
	type PerformOptions,
	type Task,
} from "~workloads/workloads/stateless/task/task.js";
import { validateJsonStringified } from "~workloads/workloads/stateless/task/validate-data-size.js";

export async function sqsDispatch<P>(
	task: Task<P>,
	data: P | P[],
	options?: PerformOptions,
) {
	if (!Array.isArray(data)) {
		validateJsonStringified(data);

		const executionId = await sqsClient.sendTask(task, options, data);
		return executionId;
	} else {
		data.forEach((d) => validateJsonStringified(d));
		return await sqsClient.sendTaskBatch(task, options, data);
	}
}

export class TaskSQSClient extends SQSClient {
	async sendTask<P>(
		task: Task<P>,
		options: PerformOptions | undefined,
		data: P,
	) {
		const queueUrl = this.#sqsTaskQueueURL(task.id)!;
		const executionId = randomUUID();
		await this.send(
			new SendMessageCommand(
				this.#messageEntry(task, queueUrl, options, executionId, data),
			),
		);
		return executionId as ExecutionId;
	}

	async sendTaskBatch<P>(
		task: Task<P>,
		options: PerformOptions | undefined,
		data: P[],
	) {
		const queueUrl = this.#sqsTaskQueueURL(task.id)!;
		const entries = data.map((p) => {
			const executionId = randomUUID();
			return {
				...this.#messageEntry(task, queueUrl, options, executionId, p),
				Id: executionId,
			};
		});
		const command = new SendMessageBatchCommand({
			QueueUrl: queueUrl,
			Entries: entries,
		});
		await this.send(command);
		return entries.map((entry) => entry.Id as ExecutionId);
	}

	async receiveTask(
		queueUrl: string,
		options: {
			waitTime: number;
			visibilityTimeout: number;
			abortController: AbortController;
		},
	) {
		const command = new ReceiveMessageCommand({
			AttributeNames: ["All"],
			MessageAttributeNames: ["All"],
			MaxNumberOfMessages: 1,
			QueueUrl: queueUrl,
			WaitTimeSeconds: options.waitTime,
			VisibilityTimeout: options.visibilityTimeout,
		});
		const { Messages } = await this.send(command, {
			abortSignal: options.abortController.signal,
		});
		if (Messages === undefined || !Array.isArray(Messages)) {
			return;
		}
		const message = Messages[0];
		assert(message, "no message received from ReceiveMessageCommand (SQS)");
		return message;
	}

	async deleteTask(queueUrl: string, messageReceiptHandle: string) {
		await this.send(
			new DeleteMessageCommand({
				QueueUrl: queueUrl,
				ReceiptHandle: messageReceiptHandle,
			}),
		);
	}

	#messageEntry<P>(
		task: Task<P>,
		queueUrl: string,
		options: PerformOptions | undefined,
		executionId: string,
		data: P,
	) {
		const messageAttributes = {
			executionId: {
				DataType: "String",
				StringValue: executionId,
			},
			attempts: {
				DataType: "String",
				StringValue: String(task.options?.retry?.times ?? 1),
			},
		};
		return {
			QueueUrl: queueUrl,
			DelaySeconds: options?.delay ? options.delay / 1000 : undefined,
			MessageAttributes: messageAttributes,
			MessageBody: JSON.stringify(data),
		};
	}

	#sqsTaskQueueURL(taskId: string) {
		return process.env[
			`MONO_TASK_${snakeCase(taskId).toUpperCase()}_SQS_QUEUE_URL`
		];
	}
}

export class TaskSQSWorker<P> {
	#client: TaskSQSClient;
	#abortController?: AbortController;

	constructor(
		public queueUrl: string,
		public task: Task<P>,
	) {
		this.#client = new TaskSQSClient();
	}

	start() {
		this.#abortController = new AbortController();
		this.work();
	}

	stop() {
		this.#abortController?.abort("TaskSQSWorker has been stopped.");
		this.#abortController = undefined;
	}

	async work() {
		if (this.#abortController === undefined) {
			return;
		}
		try {
			await this.#withReceivedMessage(async (message) => {
				await this.task.work({
					taskId: message.MessageAttributes?.executionId?.StringValue ?? "",
					data: JSON.parse(message.Body!),
				});
				await this.#client.deleteTask(this.queueUrl, message.ReceiptHandle!);
			}, this.#abortController);
		} catch (error) {
			this.task.handleError(error);
		} finally {
			this.work();
		}
	}

	async #withReceivedMessage(
		callback: (message: Message) => Promise<void>,
		abortController: AbortController,
	) {
		const message = await this.#client.receiveTask(this.queueUrl, {
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
				queueUrl: this.queueUrl,
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

const sqsClient = remember("TaskSQSClient", () => new TaskSQSClient({}));
