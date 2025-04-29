import type { SQSRecord } from "aws-lambda";

export function taskIdMessageAttribute(record: SQSRecord) {
	return record.messageAttributes!["taskId"]?.stringValue;
}

export function idempotencyId(record: SQSRecord) {
	return record.messageAttributes!["executionId"]?.stringValue;
}
