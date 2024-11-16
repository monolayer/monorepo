import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import type { LocalStackContainer } from "~sidecar/containers/local-stack.js";

function s3Client(localStackContainer: LocalStackContainer) {
	return new S3Client({
		region: "us-west-2",
		forcePathStyle: true,
		endpoint: localStackContainer.gatewayURL,
	});
}

export async function createBucket(
	bucketName: string,
	localStackContainer: LocalStackContainer,
) {
	const client = s3Client(localStackContainer);
	const createBucket = new CreateBucketCommand({
		ACL: "private",
		Bucket: bucketName,
	});
	await client.send(createBucket);
}
