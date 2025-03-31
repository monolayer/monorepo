// Example usage:

import {
	CreateTableCommand,
	DynamoDBClient,
	GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, expect, test } from "vitest";
import { associateKeyToTags, deleteTag } from "./cache-handler.mjs";

let startedTestContainer: StartedTestContainer;

process.env.DYNAMODB_TAGS_TABLE = "test-table";
process.env.AWS_ENDPOINT_URL_DYNAMODB = "http://localhost:8000";

const dynamoDBClient = new DynamoDBClient({});

beforeAll(async () => {
	const container = new GenericContainer("amazon/dynamodb-local:latest");
	container.withExposedPorts({
		container: 8000,
		host: 8000,
	});
	startedTestContainer = await container.start();

	const cmd = new CreateTableCommand({
		BillingMode: "PAY_PER_REQUEST",
		AttributeDefinitions: [
			{
				AttributeName: "PK",
				AttributeType: "S",
			},
		],
		TableName: process.env.DYNAMODB_TAGS_TABLE,
		KeySchema: [
			{
				AttributeName: "PK",
				KeyType: "HASH",
			},
		],
	});
	await dynamoDBClient.send(cmd);
});

afterAll(async () => {
	if (startedTestContainer) {
		await startedTestContainer.stop();
	}
});

test("associateKeyToMultipleTags", async () => {
	await associateKeyToTags("KeyC", ["Tag1", "Tag2"], dynamoDBClient);

	expect(await getKeysForTag("Tag1")).toStrictEqual({
		cacheKeys: { L: [{ S: "KeyC" }] },
		PK: { S: "Tag1" },
	});

	expect(await getKeysForTag("Tag2")).toStrictEqual({
		cacheKeys: { L: [{ S: "KeyC" }] },
		PK: { S: "Tag2" },
	});

	await associateKeyToTags("KeyD", ["Tag1", "Tag2"], dynamoDBClient);

	expect(await getKeysForTag("Tag1")).toStrictEqual({
		cacheKeys: { L: [{ S: "KeyC" }, { S: "KeyD" }] },
		PK: { S: "Tag1" },
	});

	expect(await getKeysForTag("Tag2")).toStrictEqual({
		cacheKeys: { L: [{ S: "KeyC" }, { S: "KeyD" }] },
		PK: { S: "Tag2" },
	});
});

test("deleteTag", async () => {
	await associateKeyToTags("KeyC", ["Tag3", "Tag4"], dynamoDBClient);
	const delete1 = await deleteTag("Tag3", dynamoDBClient);
	expect(delete1.Attributes).toStrictEqual({
		PK: { S: "Tag3" },
		cacheKeys: {
			L: [
				{
					S: "KeyC",
				},
			],
		},
	});
	expect(await getKeysForTag("Tag3")).toBeUndefined();
	const delete2 = await deleteTag("Tag4", dynamoDBClient);
	expect(delete2.Attributes).toStrictEqual({
		PK: { S: "Tag4" },
		cacheKeys: {
			L: [
				{
					S: "KeyC",
				},
			],
		},
	});
	expect(await getKeysForTag("Tag4")).toBeUndefined();
});

async function getKeysForTag(tag: string) {
	const params = {
		TableName: process.env.DYNAMODB_TAGS_TABLE,
		Key: { PK: { S: tag } },
	};

	const response = await dynamoDBClient.send(new GetItemCommand(params));
	return response.Item;
}

// // (Ensure that your AWS credentials and region are properly configured.)
// async function runExample() {
// 	const tableName = "YourDynamoDBTableName"; // Replace with your actual table name.
// 	const tagManager = new TagManager(tableName);

// 	// Associate a key to a single tag.
// 	await tagManager.associateKeyToTag("Tag1", "KeyA");
// 	console.log("Associated KeyA to Tag1");

// 	// Associate the same key to multiple tags.
// 	await tagManager.associateKeyToMultipleTags("KeyB", ["Tag1", "Tag2"]);
// 	console.log("Associated KeyB to Tag1 and Tag2");

// 	// Delete Tag1 and get the deleted keys.
// 	const deletedKeys = await tagManager.deleteTag("Tag1");
// 	console.log("Deleted Tag1. Associated keys were:", deletedKeys);
// }

// // Run the example if this module is executed directly.
// if (require.main === module) {
// 	runExample().catch((error) => {
// 		console.error("Error running example:", error);
// 	});
// }
