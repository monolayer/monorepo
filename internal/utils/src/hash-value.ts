import { gen, succeed } from "effect/Effect";
import { createHash } from "node:crypto";

export function hashValue(value: string) {
	const hash = createHash("sha256");
	hash.update(value);
	return hash.digest("hex").substring(0, 8);
}

interface HashDigestOptions {
	/**
	 * Length of the digest to generate.
	 *
	 * @default 8
	 */
	length: number;
}
/**
 * Returns a hex digest of a string.
 * @param value String to generate a digest.
 * @param options {@link HashDigestOptions}
 */
export function hashDigest(value: string, options?: HashDigestOptions) {
	return gen(function* () {
		const hash = createHash("sha256");
		hash.update(value);
		const digest = hash.digest("hex").substring(0, options?.length ?? 8);
		return yield* succeed(digest);
	});
}
