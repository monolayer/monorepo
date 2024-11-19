import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * Mailer workload.
 *
 * @group Workloads
 *
 * @example
 * ```ts
 * import { Mailer } from "@monolayer/sidecar";
 * import nodemailer from 'nodemailer';
 * const mailer = new Mailer("transactional", (connectionStringEnvVar) =>
 *   nodemailer.createTransport(
 *     process.env[connectionStringEnvVar]
 *   ),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Mailer<C> extends StatefulWorkloadWithClient<C> {
	get connStringComponents() {
		return ["mailer", this.id];
	}
}
