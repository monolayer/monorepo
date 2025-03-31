export function appendToAllowedOrigins(obj, newValue) {
	const path = "experimental.serverActions.allowedOrigins";
	const keys = path.split(".");
	let current = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];

		if (!current[key] || typeof current[key] !== "object") {
			current[key] = {};
		}

		current = current[key];
	}

	if (!Array.isArray(current[keys[keys.length - 1]])) {
		current[keys[keys.length - 1]] = [];
	}

	current[keys[keys.length - 1]].push(newValue);
}
