import { CamelCasePlugin } from "kysely";
import type { CamelCaseOptions } from "~/camel-case-options.js";

class CamelCase extends CamelCasePlugin {
	toSnakeCase(str: string): string {
		return this.snakeCase(str);
	}
}

export function toSnakeCase(str: string, camelCase: CamelCaseOptions) {
	if (camelCase.enabled === true) {
		return new CamelCase(camelCase.options).toSnakeCase(str);
	}
	return str;
}
