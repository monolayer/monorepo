import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for an AWS S3 compatible storage.
 *
 * **IMPORTANT**
 *
 * When initializing the client, you need to configure `forcePathStyle` and `endpoint`
 * if the dev or test container is running (*the `MONO_AWS_ENDPOINT_URL` environment
 * variable will be set*). See the example.
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
