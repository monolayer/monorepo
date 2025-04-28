import {
	SQSClient as AWSSQSClient,
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SendMessageBatchCommand,
	SendMessageCommand,
} from "@aws-sdk/client-sqs";
import assert from "assert";
import { snakeCase } from "case-anything";
import { randomUUID } from "node:crypto";
import type { ExecutionId, PerformOptions, Task } from "src/types.js";

export class SQSClient extends AWSSQSClient {
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

	#sqsTaskQueueURL(taskId: string) {
		return process.env[
			`MONO_TASK_${snakeCase(taskId).toUpperCase()}_SQS_QUEUE_URL`
		];
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
}
