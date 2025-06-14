import {
	ConditionalCheckFailedException,
	DynamoDBClient,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";

export async function insertId(
	id: string,
	ttlSeconds: number,
	opts?: { client?: DynamoDBClient },
) {
	try {
		const dynamoClient = opts?.client ?? new DynamoDBClient({});
		const now = new Date();
		now.setSeconds(now.getSeconds() + ttlSeconds * 1000);
		await dynamoClient.send(
			new PutItemCommand({
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Item: {
					PK: { S: id },
					SK: { S: id },
					ttl: { N: Math.floor(now.getTime() / 1000).toString() },
				},
				ConditionExpression: "attribute_not_exists(PK)",
			}),
		);
		return true;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		if (e instanceof ConditionalCheckFailedException) {
			return false;
		} else {
			throw e;
		}
	}
}
