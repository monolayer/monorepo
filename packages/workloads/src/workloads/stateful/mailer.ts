import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

/**
 * Mailer workload.
 *
 *
 * @example
 * ```ts
 * import { Mailer } from "@monolayer/sidecar";
 * import nodemailer from 'nodemailer';
 *
 * const mailer = new Mailer("transactional", (envVarName) =>
 *   nodemailer.createTransport(
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
