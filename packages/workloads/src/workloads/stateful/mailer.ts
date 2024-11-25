import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Workload for SMTP mailers.
 *
 * The `Mailer` workload is initialized with:
 * - A stable ID.
 * - A client constructor function providing the client of your choice.
 *   The {@link Mailer.client | client } accessor will call this function and memoize its result.
 *   The expected envirnoment variable name with the connection string is passed as an argument.
 * **NOTES**
 *
 * When launching the development or test containers with `npx workloads start`, the environment
 * variable with the connection string for the workload's Docker container
 * will be written to the corresponding dotenv file (`.env` or `.env.test`)
 *
 * @example
 * ```ts
 * import { Mailer } from "@monolayer/workloads";
 * import nodemailer from 'nodemailer';
 *
 * const mailer = new Mailer("transactional", (envVarName) =>
 *   nodemailer.createTransport(
 *     // envVarName = MONO_MAILER_TRANSACTIONAL_URL
 *     process.env[envVarName]
 *   ),
 * );
 *
 * // Sending an email
 * await mailer.client.sendMail({
 *   from: "sender@example.com",
 *   to: "recipient@example.com",
 *   subject: "Message in a bottle",
 *   text: "I hope this message gets there!",
 * });

 * ```
 *
 * @typeParam C - Client type
 */
export class Mailer<C> extends StatefulWorkloadWithClient<C> {
	/**
	 * @internal
	 */
	declare _brand: "Mailer";
	/**
	 * @internal
	 */
	get connStringComponents() {
		return ["mailer", this.id];
	}
}
