import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { beforeAll, expect, test } from "vitest";
import { insertId } from "./idempotency.js";

let client: DynamoDBClient;

beforeAll(() => {
	client = new DynamoDBClient();
});

test("fails when insering a repeated id", { timeout: 20000 }, async () => {
	expect(await insertId("1214", 10, { client })).toBeTruthy();
	expect(await insertId("1214", 10, { client })).toBeFalsy();
});
