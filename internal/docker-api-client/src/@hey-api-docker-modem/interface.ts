import ts from "typescript";
import { blankSourceFile, printer } from "./utils.js";

interface BodyInterfaceOptions {
	id: string;
	name: string;
	type: string;
	description?: string;
	required: boolean;
}

export function inputStreamBodyInterface(
	options: BodyInterfaceOptions,
): ts.InterfaceDeclaration {
	const bodyType = ts.factory.createTypeReferenceNode(
		ts.factory.createIdentifier("Buffer"),
		undefined,
	);

	const bodyProperty = ts.factory.createPropertySignature(
		undefined, // No modifiers
		ts.factory.createIdentifier("body"),
		options.required
			? undefined
			: ts.factory.createToken(ts.SyntaxKind.QuestionToken),
		bodyType,
	);

	if (options.description) {
		const fnComments = [options.description]
			.filter((e) => e !== null)
			.join("\n\n");

		const jsdoc = ts.factory.createJSDocComment(
			ts.factory.createNodeArray([ts.factory.createJSDocText(`${fnComments}`)]),
			undefined,
		);

		const printedComments = printer
			.printNode(ts.EmitHint.Unspecified, jsdoc, blankSourceFile())
			.replace("/**", "*")
			.replace("*/", "\n")
			.replace("*  */", "");

		ts.addSyntheticLeadingComment(
			bodyProperty,
			ts.SyntaxKind.MultiLineCommentTrivia,
			printedComments,
			true,
		);
	}

	return ts.factory.createInterfaceDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		ts.factory.createIdentifier(`${options.id}Body`),
		undefined,
		undefined,
		[bodyProperty],
	);
}
