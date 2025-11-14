import {
	DeleteItemCommand,
	DynamoDBClient,
	TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import {
	DeleteObjectsCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import { fromUtf8 } from "@aws-sdk/util-utf8-node";
import path from "node:path";

const S3_BUCKET = process.env.NEXTJS_ADAPTER_CACHE_BUCKET_NAME;
const CACHE_PREFIX = `server-cache/${process.env.NEXTJS_ADAPTER_BUILD_ID}/`;

const s3 = new S3Client();

const dynamoDBClient = new DynamoDBClient({});

export default class CustomCacheHandler {
	constructor(options) {
		this.options = options;
	}

	getS3Key(key) {
		return path.join(CACHE_PREFIX, `${key}.json`);
	}

	async get(key) {
		try {
			debug("cache handler: get key", key);
			const s3Key = this.getS3Key(key);
			const { Body } = await s3.send(
				new GetObjectCommand({
					Bucket: S3_BUCKET,
					Key: s3Key,
				}),
			);

			if (!Body) return null;
			const data = await Body.transformToString();
			return JSON.parse(data, jsonReviver);
		} catch (error) {
			if (error.name === "NoSuchKey") return null;
			console.error("Error fetching from S3:", error);
			return null;
		}
	}

	async set(key, data, ctx) {
		debug("cache handler: set key", key);
		try {
			const s3Key = this.getS3Key(key);
			const entry = {
				value: data,
				lastModified: Date.now(),
				tags: ctx.tags,
			};
			const tags = [ctx.tags].flat().filter((t) => t !== undefined);
			if (tags.length !== 0)
				await associateKeyToTags(s3Key, tags, dynamoDBClient);
			await s3.send(
				new PutObjectCommand({
					Bucket: S3_BUCKET,
					Key: s3Key,
					Body: fromUtf8(JSON.stringify(entry)),
					ContentType: "application/json",
				}),
			);
		} catch (error) {
			console.error("cache handler: error setting cache key", key, error);
		}
	}

	async revalidateTag(tags) {
		debug("cache handler: revalidate tags", tags);
		const tagList = [tags].flat();
		for (const tag of tagList) {
			try {
				const response = await deleteTag(tag, dynamoDBClient);
				if (
					response.Attributes &&
					response.Attributes.cacheKeys &&
					response.Attributes.cacheKeys.L
				) {
					const s3Keys = response.Attributes.cacheKeys.L.map((key) => key.S);
					await s3.send(
						new DeleteObjectsCommand({
							Bucket: S3_BUCKET,
							Delete: {
								Objects: s3Keys.map((key) => ({ Key: key })),
							},
						}),
					);
				}
			} catch (e) {
				console.error(`cache handler: error revalidating tag: ${tag}`, e);
			}
		}
	}

	resetRequestCache() {
		// No-op for S3-based caching
	}
}

export async function associateKeyToTags(key, tags, client) {
	const dynamodbClient = client === undefined ? new DynamoDBClient({}) : client;
	const transactItems = tags.map((tag) => ({
		Update: {
			TableName: process.env.NEXTJS_ADAPTER_DYNAMODB_TAGS_TABLE,
			Key: { PK: { S: tag } },
			UpdateExpression:
				"SET cacheKeys = list_append(if_not_exists(cacheKeys, :empty_list), :new_key)",
			ExpressionAttributeValues: {
				":new_key": { L: [{ S: key }] },
				":empty_list": { L: [] },
			},
		},
	}));

	const params = {
		TransactItems: transactItems,
	};

	return await dynamodbClient.send(new TransactWriteItemsCommand(params));
}

export async function deleteTag(tag, client) {
	const dynamodbClient = client === undefined ? new DynamoDBClient({}) : client;
	const params = {
		TableName: process.env.NEXTJS_ADAPTER_DYNAMODB_TAGS_TABLE,
		Key: { PK: { S: tag } },
		ReturnValues: "ALL_OLD",
	};

	const response = await dynamodbClient.send(new DeleteItemCommand(params));
	return response;
}

function debug(...msg) {
	if (process.env.NEXTJS_ADAPTER_CACHE_DEBUG === "true") {
		console.debug(...msg);
	}
}

function jsonReviver(_key, value) {
	if (value && value.type === "Buffer" && value.data) {
		return Buffer.from(value.data, "base64");
	}
	return value;
}
