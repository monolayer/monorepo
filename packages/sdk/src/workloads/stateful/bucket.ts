import { snakeCase } from "case-anything";
import { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for an AWS S3 compatible storage.
 *
 * The `Bucket` workload is initialized with:
 * - A valid bucket name.
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
 *
 * const documents = new Bucket("documents");
 *
 * export default documents;
 *
 * // Client configuration
 *
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { bucketLocalConfiguration } from "@monolayer/sdk";
 * export const s3Client = new S3Client({
 *   ...bucketLocalConfiguration(),
 * });
 *
 * // Get Object
 *
 * const response = await s3Client.send(
 *   new GetObjectCommand({
 *     Bucket: documents.name,
 *     Key: "README.md",
 *   }),
 * );
 *
 * ```
 */
export class Bucket<TOptions extends BucketOptions> extends StatefulWorkload {
	/**
	 * Defines public access permissions for specific paths within the bucket.
	 * This allows anonymous users to perform actions on objects matching the specified path patterns.
	 */
	publicAccess: PublicAccess;

	constructor(
		/**
		 * Bucket ID.
		 */
		id: string,
		/**
		 * Bucket options
		 */
		options?: TOptions,
	) {
		super(id);
		this.publicAccess = options?.publicAccess ?? {};
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

export type AccessGrant = "get" | "list" | "write" | "delete";

export type PublicAccess = Record<string, AccessGrant[]>;

export interface BucketOptions {
	/**
	 * Defines public access permissions for specific paths within the bucket.
	 * This allows anonymous users to perform actions like 'get', 'list', 'write', or 'delete'
	 * on objects matching the specified path patterns.
	 */
	publicAccess?: PublicAccess;
}

const bucketEndPointEnvVarName = "ML_BUCKET_ENDPOINT";
