import { snakeCase } from "case-anything";
import { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for an AWS S3 compatible storage.
 *
 * The `Bucket` workload is initialized with:
 * - A valid bucket name.
 * - An optional Options object to set public read accesss.
 *
 * **NOTES**
 *
 * Launching the development or test containers with `npx monolayer start dev` will write the environment
 * variable `ML_AWS_ENDPOINT_URL` will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * When initializing the S3 client, you need to configure `forcePathStyle` and `endpoint`
 * if the dev or test container is running (*check for the `ML_AWS_ENDPOINT_URL` environment
 * variable*). See the example.
 *
 * @example
 * ```ts
 * import { Bucket } from "@monolayer/sdk";
 * import { S3Client } from "@aws-sdk/client-s3";
 *
 * const imagesBucket = new Bucket("workloads-images");
 * const documentsBucket = new Bucket("workloads-images", { publicRead: true });
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
 *
 * const documentsBucket = new Bucket("workloads-images", { publicRead: true });
 * ```
 */
export class Bucket extends StatefulWorkload {
	/**
	 * Whether the bucket has public read access permissions.
	 *
	 * @default false
	 */
	publicRead: boolean;

	constructor(
		/**
		 * Bucket ID.
		 */
		id: string,
		/**
		 * Bucket options
		 */
		options?: BucketOptions,
	) {
		super(id);
		this.publicRead = options?.publicRead ?? false;
	}

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
		credentials: {
			accessKeyId: "minioadmin",
			secretAccessKey: "minioadmin",
		},
	};
}

export interface BucketOptions {
	/**
	 * Whether the bucket has public read access permission.
	 */
	publicRead?: boolean;
}

const bucketEndPointEnvVarName = "ML_BUCKET_ENDPOINT";
