import * as ts from "typescript";

export const printer = ts.createPrinter({
	newLine: ts.NewLineKind.LineFeed,
	removeComments: false,
});

export const blankSourceFile = () =>
	ts.createSourceFile("", "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);

export function stringToStatements(code: string) {
	return parseStringToAST(code).statements;
}

function parseStringToAST(code: string): ts.SourceFile {
	return ts.createSourceFile(
		"temp.ts", // File name (can be arbitrary for in-memory parsing)
		code, // The code string to parse
		ts.ScriptTarget.ES2022, // ECMAScript version
		false, // SetParentNodes (helpful for traversing later)
		ts.ScriptKind.TS, // Script kind (TypeScript file)
	);
}
