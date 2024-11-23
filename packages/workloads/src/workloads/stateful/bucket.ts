import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for an AWS S3 compatible storage.
 *
 * The `Bucket` workload is initialized with:
 * - A valid bucket name.
 * - A client constructor function providing the client of your choice.
 *   The {@link Bucket.client | client } accessor will call this function and memoize its result.

 * **NOTES**
 *
 * Launching the development or test containers with `npx workloads start` will write the environment
 * variable `MONO_AWS_ENDPOINT_URL` will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * When initializing the client, you need to configure `forcePathStyle` and `endpoint`
 * if the dev or test container is running (*check for the `MONO_AWS_ENDPOINT_URL` environment
 * variable*). See the example.
 *
 * @example
 * ```ts
 * import { Bucket } from "@monolayer/workloads";
 * import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
 *
 * const imagesBucket = new Bucket(
 * 	"workloads-images",
 * 	() =>
 * 		new S3Client({
 *      // Configure forcePathStyle and endpoint
 *      // when the dev or test container is running
 *      ...(process.env.MONO_AWS_ENDPOINT_URL
 *        ? {
 *            forcePathStyle: true,
 *            endpoint: process.env.MONO_AWS_ENDPOINT_URL,
 *          }
 *        : {}),
 *      // Other configuration options
 *    }),
 * );
 *
 * const response = await imagesBucket.client.send(
 *   new GetObjectCommand({
 *     Bucket: imagesBucket.name,
 *     Key: "README.md",
 *   }),
 * );
 * ```
 */
export class Bucket<C> extends StatefulWorkloadWithClient<C> {
	constructor(
		/**
		 * Bucket name. Same as `id`.
		 */
		public readonly name: string,
		/**
		 * Client constructor function. Executed once when accessing the `client` property.
		 */
		client: () => C,
	) {
		super(name, client);
	}

	get connStringComponents() {
		return ["aws", "endpoint"];
	}
}
