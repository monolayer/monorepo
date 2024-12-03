export function validateJsonStringified<P>(data: P, max: number = 256000) {
	const dataString = JSON.stringify(typeof data === "undefined" ? {} : data);
	const byteLength = Buffer.byteLength(dataString, "utf8");

	if (byteLength > max) {
		throw new Error(`Data size exceeds the limit (${max} bytes)`);
	}
}
