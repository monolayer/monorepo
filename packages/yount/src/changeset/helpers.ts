import { CamelCasePlugin } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";

export function executeKyselySchemaStatement(
	schemaName: string,
	...args: string[]
) {
	return [
		`await db.withSchema("${schemaName}").schema`,
		...args,
		"execute();",
	].filter((x) => x !== "");
}

export function executeKyselyDbStatement(statement: string) {
	return [`await ${sqlStatement(statement)}`, "execute(db);"];
}

export function sqlStatement(value: string) {
	return ["sql`", value, "`"].join("");
}

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
