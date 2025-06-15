// counter.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();

export async function incrementFinished(id: string) {
	const response = await client.send(
		updateCommandInput({ task: id, attribute: "finished" }),
	);
	return response.Attributes?.finished;
}

export async function incrementFailed(id: string) {
	const response = await client.send(
		updateCommandInput({ task: id, attribute: "failed" }),
	);
	return response.Attributes?.failed;
}

function updateCommandInput({
	task,
	attribute,
}: {
	task: string;
	attribute: string;
}) {
	return new UpdateCommand({
		TableName: process.env.DYNAMODB_TABLE_NAME,
		Key: { PK: `STATS-${task}`, SK: `STATS-${task}` },
		UpdateExpression: `SET ${attribute} = if_not_exists(${attribute}, :zero) + :inc`,
		ExpressionAttributeValues: {
			":zero": 0,
			":inc": 1,
		},
		ReturnValues: "UPDATED_NEW",
	});
}
