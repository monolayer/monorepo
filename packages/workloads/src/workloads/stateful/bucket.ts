import { snakeCase } from "case-anything";
import { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for an AWS S3 compatible storage.
 *
 * The `Bucket` workload is initialized with:
 * - A valid bucket name.

 * **NOTES**
 *
 * Launching the development or test containers with `npx workloads start` will write the environment
 * variable `ML_AWS_ENDPOINT_URL` will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * When initializing the S3 client, you need to configure `forcePathStyle` and `endpoint`
 * if the dev or test container is running (*check for the `ML_AWS_ENDPOINT_URL` environment
 * variable*). See the example.
 *
 * @example
 * ```ts
 * import { Bucket } from "@monolayer/workloads";
 * import { S3Client } from "@aws-sdk/client-s3";
 *
 * const imagesBucket = new Bucket("workloads-images");
 *
 * const s3Client = new S3Client({
 *   // Configure forcePathStyle and endpoint
 *   // when the dev or test container is running
 *   ...(process.env.ML_AWS_ENDPOINT_URL
 *     ? {
 *         forcePathStyle: true,
 *         endpoint: process.env.ML_AWS_ENDPOINT_URL,
 *        }
 *     : {}),
 *   // Other configuration options
 * }),

 * const response = await s3Client.send(
 *   new GetObjectCommand({
 *     Bucket: imagesBucket.name,
 *     Key: "README.md",
 *   }),
 * );
 * ```
 */
export class Bucket extends StatefulWorkload {
	get name() {
		if (process.env.NODE_ENV === "production") {
			const envVarName = snakeCase(
				["ml", this.id, "bucket", "name"].join("-"),
			).toUpperCase();
			const bucketName = process.env[envVarName];
			if (bucketName === undefined) {
				throw new Error(
					`Undefined bucket name for Bucket ${this.id}. ${envVarName} not set.`,
				);
			}
			return bucketName;
		} else {
			return [this.id, process.env.NODE_ENV].join("-");
		}
	}

	/**
	 * @internal
	 */
	get connectionStringEnvVar() {
		return bucketEndPointEnvVarName;
	}
}

export function bucketLocalConfiguration() {
	if (process.env.NODE_ENV === "production") return {};
	return {
		forcePathStyle: true,
		endpoint: process.env[bucketEndPointEnvVarName],
	};
}

const bucketEndPointEnvVarName = "ML_BUCKET_ENDPOINT";
