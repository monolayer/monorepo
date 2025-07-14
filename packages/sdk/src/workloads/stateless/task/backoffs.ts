export interface ConstantBackoff {
	type: "constant";
	delay: number;
}

export interface ExponentialBackoff {
	type: "exponential";
	delay: number;
}

export function computeBackoff(
	attemptsMade: number,
	backoff?: ExponentialBackoff | ConstantBackoff,
) {
	if (backoff !== undefined) {
		switch (backoff.type) {
			case "constant":
				return backoff.delay;
			case "exponential":
				if (backoff.delay < 0 || attemptsMade < 0) {
					throw new Error("Retry number cannot be less that 0");
				}
				return Math.round(Math.pow(2, attemptsMade) * backoff.delay);
		}
	}
	return 0;
}
