export const tasksLambdaHander = `\
import {
	ChangeMessageVisibilityCommand,
	DeleteMessageBatchCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";

const sqs = new SQSClient();
const queueUrl = process.env.QUEUE_URL;
const importFile = process.env.TASK_PATH;
let task;

export const handler = async (event) => {
	if (task === undefined) {
		task = await import(importFile);
	}
	try {
		const recordsToDelete = [];
		const errors = [];
		for (const record of event.Records) {
			try {
				await task.default.work({
					taskId: record.messageId,
					data: JSON.parse(record.body),
				});
				recordsToDelete.push(record);
			} catch (e) {
				console.log("error in task", e);
				handleError(e);
				await handleRetry(record, errors, recordsToDelete);
			}
		}
		await deleteMessagesFromQueue(recordsToDelete);
		return {
			batchItemFailures: errors,
		};
	} catch (error) {
		console.log("Error while processing:", error);
		for (const record of event.Records) {
			await changeVisibility(record);
		}
		return {
			batchItemFailures: event.Records.map((r) => ({
				itemIdentifier: r.messageId,
			})),
		};
	}
};

async function handleRetry(record, errors, recordsToDelete) {
	if (task.options === undefined) return;
	if (task.options.retry) {
		if (Number(record.attributes.ApproximateReceiveCount) < task.options.retry.times) {
			errors.push({ itemIdentifier: record.messageId });
			await changeVisibility(record);
		} else {
			recordsToDelete.push(record);
		}
	}
}

function handleError(e) {
	if (task.options === undefined) return;
	if (task.options.onError) {
		try {
			task.options.onError(new Error("Task error", { cause: e }));
		} catch {
			//
		}
	}
}

async function changeVisibility(record) {
	await sqs.send(
		new ChangeMessageVisibilityCommand({
			QueueUrl: queueUrl,
			ReceiptHandle: record.receiptHandle,
			VisibilityTimeout: 30,
		}),
	);
}

async function deleteMessagesFromQueue(records) {
	const entries = records.map((record) => ({
		Id: record.messageId,
		ReceiptHandle: record.receiptHandle,
	}));
	if (entries.length === 0) return;
	await sqs.send(
		new DeleteMessageBatchCommand({
			QueueUrl: queueUrl,
			Entries: entries,
		}),
	);
}
`;

export function lambdaDockerfile(taskFiles: string[]) {
	return `\
FROM public.ecr.aws/lambda/nodejs:20

RUN npm install -g tsup typescript

COPY . \${LAMBDA_TASK_ROOT}

RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

RUN tsup ${taskFiles.map((t) => t).join(" ")}

CMD [ "lambda.handler" ]
`;
}

export const tsupConfig = `\
import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs"],
  outDir: "dist/ml-lambda",
  dts: false,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  target: "node20",
  platform: "node",
  minify: false,
  bundle: true,
  noExternal: [/(.*)/],
  splitting: false,
  cjsInterop: false,
  treeshake: true,
  sourcemap: true,
});
`;
