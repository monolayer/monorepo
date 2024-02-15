export function executeKyselySchemaStatement(...args: string[]) {
	return ["await db.schema", ...args, "execute();"].filter((x) => x !== "");
}

export function executeKyselyDbStatement(statement: string) {
	return [`await ${sqlStatement(statement)}.execute(db);`];
}

export function executeKyselyDbStatements(statements: string[]) {
	return statements.flatMap((statement) => {
		return executeKyselyDbStatement(statement);
	});
}

export function sqlStatement(value: string) {
	return ["sql`", value, "`"].join("");
}
