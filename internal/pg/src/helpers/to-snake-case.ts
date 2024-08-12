import { CamelCasePlugin } from "kysely";

class CamelCase extends CamelCasePlugin {
	toSnakeCase(str: string): string {
		return this.snakeCase(str);
	}
}

export function toSnakeCase(str: string, camelCase: boolean) {
	if (camelCase) {
		return new CamelCase().toSnakeCase(str);
	}
	return str;
}
