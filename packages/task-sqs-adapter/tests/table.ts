import {
	CreateTableCommand,
	DeleteTableCommand,
	DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

export async function createTable() {
	const dynamodbClient = new DynamoDBClient();
	await dynamodbClient.send(
		new CreateTableCommand({
			TableName: process.env.DYNAMODB_TABLE_NAME,
			KeySchema: [
				{ AttributeName: "PK", KeyType: "HASH" },
				{ AttributeName: "SK", KeyType: "RANGE" },
			],
			AttributeDefinitions: [
				{ AttributeName: "PK", AttributeType: "S" },
				{ AttributeName: "SK", AttributeType: "S" },
			],
			BillingMode: "PAY_PER_REQUEST",
		}),
	);
}

export async function deleteTable() {
	const dynamodbClient = new DynamoDBClient();
	try {
		await dynamodbClient.send(
			new DeleteTableCommand({
				TableName: process.env.DYNAMODB_TABLE_NAME,
			}),
		);
	} catch {
		//
	}
}
