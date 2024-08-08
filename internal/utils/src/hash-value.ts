import { createHash } from "crypto";

export function hashValue(value: string) {
	const hash = createHash("sha256");
	hash.update(value);
	return hash.digest("hex").substring(0, 8);
}
