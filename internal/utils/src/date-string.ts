export function dateStringWithMilliseconds() {
	return new Date()
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(".", "")
		.replace("T", "")
		.replace("Z", "");
}
