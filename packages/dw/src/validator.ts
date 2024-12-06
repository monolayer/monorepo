import { validate as dockerfileValidate } from "dockerfile-utils";
import { Dockerfile } from "~dw/df.js";

/**
 * Validates a {@link Dockerfile }.
 *
 * @throws `Error` if the Dockerfile is not valid.
 */
export function validate(dw: Dockerfile) {
	const diagnostic = dockerfileValidate(dw.toString());
	if (diagnostic.length !== 0) {
		console.dir(diagnostic);
		throw new Error("Invalid Dockerfile", { cause: diagnostic });
	}
	return true;
}
