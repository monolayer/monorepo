import { SES } from "@aws-sdk/client-ses";
import { snakeCase } from "case-anything";
import { SESContainer } from "~resources/mailers/ses/container.js";
import { readEnvVar } from "~resources/read-env.js";

/**
 * SES `Mailer`.
 *
 * Expects an environment variable to be set AWS_SES_REGION.
 *
 */
export class SESMailer {
	container: SESContainer;

	connectionStringEnvVarName: string;

	constructor(public id: string) {
		this.connectionStringEnvVarName = snakeCase(
			`ses_mailer_${id}_url`,
		).toUpperCase();
		this.container = new SESContainer({
			resourceId: id,
			connectionStringEnvVarName: this.connectionStringEnvVarName,
		});
	}

	#client?: SES;

	get client() {
		if (this.#client === undefined) {
			this.#client = new SES({
				...(process.env.F4_ENV === "local"
					? {
							endpoint: readEnvVar(this.connectionStringEnvVarName),
							region: "aws-ses-v2-local",
							credentials: {
								accessKeyId: "ANY_STRING",
								secretAccessKey: "ANY_STRING",
							},
						}
					: { region: process.env.AWS_SES_REGION }),
			});
		}
		return this.#client;
	}
}

export function defineSESMailer(id: string) {
	return new SESMailer(id);
}
