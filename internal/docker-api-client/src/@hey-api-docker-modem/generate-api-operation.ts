import ts from "typescript";
import { stringToStatements } from "./utils.js";

interface GenerateApiOperationOptions {
	name: string;
	inputType: string;
	outputType: string;
	path: string;
	method: string;
	hijack: boolean;
	stream: boolean;
	statusCodes: Record<string, string | boolean>;
	options: "query" | "body" | "query-body" | null;
	headers: boolean;
	bodyType?: string;
}

const logStatement = stringToStatements(`logCall(dialOptions);`);

const ifStatement = stringToStatements(`
	return promisifiedDial(dialOptions);
`);

const streamStatement = stringToStatements(`
	demuxedDial(dialOptions, callback);
`);

export function generateApiFunctionDeclaration({
	name,
	inputType,
	outputType,
	path,
	method,
	stream,
	hijack,
	statusCodes,
	options,
	headers,
	bodyType,
}: GenerateApiOperationOptions) {
	const responseType = ts.factory.createTypeReferenceNode(outputType);

	// ExtendedOptions
	const parameters = [
		ts.factory.createParameterDeclaration(
			undefined,
			undefined,
			"opts",
			undefined,
			bodyType
				? ts.factory.createTypeReferenceNode("ExtendedOptionsWithBody", [
						ts.factory.createTypeReferenceNode(inputType),
						ts.factory.createTypeReferenceNode(bodyType),
					])
				: inputType === "NoData"
					? ts.factory.createTypeReferenceNode("Options")
					: ts.factory.createTypeReferenceNode("ExtendedOptions", [
							ts.factory.createTypeReferenceNode(inputType),
						]),
			undefined,
		),
		stream
			? ts.factory.createParameterDeclaration(
					undefined,
					undefined,
					"callback",
					undefined,
					ts.factory.createTypeReferenceNode("StreamCallbackFn"),
					undefined,
				)
			: undefined,
	].filter((p) => p !== undefined);

	const templateStringPath = [
		path.replace(/{/g, "${opts.path."),
		options == "query" || options == "query-body" ? "?" : "",
	].join("");
	const dialOptionsDeclaration = dialOptions(
		templateStringPath,
		method,
		options,
		bodyType,
		hijack,
		stream,
		headers,
		statusCodes,
	);

	const functionBody = ts.factory.createBlock(
		[
			dialOptionsDeclaration,
			...logStatement,
			...(stream ? streamStatement : ifStatement),
		],
		true,
	);

	const returnType = ts.factory.createUnionTypeNode(
		[
			stream
				? ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
				: ts.factory.createTypeReferenceNode("Promise", [responseType]),
		].filter((e) => e !== undefined),
	);

	const functionDeclaration = ts.factory.createFunctionDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		undefined,
		name,
		undefined,
		parameters,
		returnType,
		functionBody,
	);

	return functionDeclaration;
}

function dialOptions(
	templateStringPath: string,
	method: string,
	options: "query" | "body" | "query-body" | null,
	bodyType: string | undefined,
	hijack: boolean,
	stream: boolean,
	headers: boolean,
	statusCodes: Record<string, string | boolean>,
) {
	let optionsIdentifier = "";
	switch (options) {
		case "body":
			optionsIdentifier = templateStringPath.includes("opts.path")
				? "withoutPath(opts).body"
				: "opts.body";
			break;
		case "query":
			optionsIdentifier = templateStringPath.includes("opts.path")
				? "withoutPath(opts).query"
				: "opts.query";
			break;
		case "query-body":
			optionsIdentifier = templateStringPath.includes("opts.path")
				? "{...withoutPath(opts).query, _body: withoutPath(opts).body}"
				: "{...opts.query, _body: opts.body }";
			break;
	}

	return ts.factory.createVariableStatement(
		undefined,
		ts.factory.createVariableDeclarationList(
			[
				ts.factory.createVariableDeclaration(
					"dialOptions",
					undefined,
					undefined,
					ts.factory.createObjectLiteralExpression(
						[
							ts.factory.createPropertyAssignment(
								"path",
								ts.factory.createIdentifier(`\`${templateStringPath}\``),
							),
							ts.factory.createPropertyAssignment(
								"method",
								ts.factory.createStringLiteral(method),
							),
							...(options !== null
								? [
										ts.factory.createPropertyAssignment(
											"options",
											ts.factory.createIdentifier(
												bodyType
													? bodyType === "ArrayBody"
														? templateStringPath.includes("opts.path")
															? `withoutPath(opts).${options}`
															: `opts.${options}`
														: `withoutBodyAndPath(opts).query`
													: optionsIdentifier,
											),
										),
									]
								: []),
							ts.factory.createPropertyAssignment(
								"abortSignal",
								ts.factory.createIdentifier("opts.abortSignal"),
							),
							...(bodyType && bodyType !== "ArrayBody"
								? [
										ts.factory.createPropertyAssignment(
											"file",
											ts.factory.createIdentifier("opts.body"),
										),
									]
								: []),
							...(hijack
								? [
										ts.factory.createPropertyAssignment(
											"hijack",
											ts.factory.createIdentifier("true"),
										),
									]
								: []),
							...(stream || hijack
								? [
										ts.factory.createPropertyAssignment(
											"isStream",
											ts.factory.createIdentifier("true"),
										),
									]
								: []),
							...(headers
								? [
										ts.factory.createPropertyAssignment(
											"headers",
											ts.factory.createIdentifier("opts.headers ?? {}"),
										),
									]
								: []),
							ts.factory.createPropertyAssignment(
								"statusCodes",
								ts.factory.createObjectLiteralExpression(
									Object.entries(statusCodes).map(([s, b]) =>
										ts.factory.createPropertyAssignment(
											s,
											String(b) === "true"
												? ts.factory.createIdentifier("true")
												: ts.factory.createStringLiteral(String(b)),
										),
									),
									true,
								),
							),
						],
						true,
					),
				),
			],
			ts.NodeFlags.Const,
		),
	);
}

export function generateApiFunctionOverload1({
	name,
	inputType,
	outputType,
	bodyType,
}: GenerateApiOperationOptions) {
	const responseType = ts.factory.createTypeReferenceNode(outputType);

	return ts.factory.createFunctionDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		undefined,
		name,
		undefined,
		[
			ts.factory.createParameterDeclaration(
				undefined,
				undefined,
				"opts",
				undefined,
				bodyType
					? ts.factory.createTypeReferenceNode("ExtendedOptionsWithBody", [
							ts.factory.createTypeReferenceNode(inputType),
							ts.factory.createTypeReferenceNode(bodyType),
						])
					: inputType === "NoData"
						? ts.factory.createTypeReferenceNode("Options")
						: ts.factory.createTypeReferenceNode("ExtendedOptions", [
								ts.factory.createTypeReferenceNode(inputType),
							]),
				undefined,
			),
		],
		ts.factory.createUnionTypeNode([
			ts.factory.createTypeReferenceNode("Promise", [responseType]),
		]),
		undefined,
	);
}

// export function generateApiFunctionOverload2({
// 	name,
// 	inputType,
// 	outputType,
// 	stream,
// 	bodyType,
// }: GenerateApiOperationOptions) {
// 	const responseType = ts.factory.createTypeReferenceNode(outputType);

// 	const parameters = [
// 		ts.factory.createParameterDeclaration(
// 			undefined,
// 			undefined,
// 			"opts",
// 			undefined,
// 			bodyType
// 				? ts.factory.createTypeReferenceNode("ExtendedOptionsWithBody", [
// 						ts.factory.createTypeReferenceNode(inputType),
// 						ts.factory.createTypeReferenceNode(bodyType),
// 					])
// 				: inputType === "NoData"
// 					? ts.factory.createTypeReferenceNode("Options")
// 					: ts.factory.createTypeReferenceNode("ExtendedOptions", [
// 							ts.factory.createTypeReferenceNode(inputType),
// 						]),
// 			undefined,
// 		),
// 		ts.factory.createParameterDeclaration(
// 			undefined,
// 			undefined,
// 			"callback",
// 			ts.factory.createToken(ts.SyntaxKind.QuestionToken),
// 			stream
// 				? ts.factory.createTypeReferenceNode("StreamCallbackFn")
// 				: ts.factory.createTypeReferenceNode("CallbackFn", [responseType]),
// 			undefined,
// 		),
// 	];

// 	return ts.factory.createFunctionDeclaration(
// 		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
// 		undefined,
// 		name,
// 		undefined,
// 		parameters,
// 		ts.factory.createUnionTypeNode([
// 			ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
// 		]),
// 		undefined,
// 	);
// }
