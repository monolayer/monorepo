import {
	CreateBucketCommand,
	HeadBucketCommand,
	NotFound,
	S3Client,
} from "@aws-sdk/client-s3";

export async function createBucket(bucketName: string, gatewayURL: string) {
	const client = new S3Client({
		region: "us-west-1",
		credentials: {
			accessKeyId: "localstack",
			secretAccessKey: "localstack",
		},
		forcePathStyle: true,
		endpoint: gatewayURL,
	});
	if (await missingBucket(bucketName, client)) {
		const createBucket = new CreateBucketCommand({
			ACL: "private",
			Bucket: bucketName,
		});
		return await client.send(createBucket);
	}
}

async function missingBucket(bucketName: string, client: S3Client) {
	try {
		await client.send(new HeadBucketCommand({ Bucket: bucketName }));
		return false;
	} catch (e) {
		if (e instanceof NotFound) {
			return true;
		}
		throw e;
	}
}
