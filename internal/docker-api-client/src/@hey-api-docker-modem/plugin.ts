import type { Plugin } from "@hey-api/openapi-ts";
import { camelCase } from "case-anything";
import ts from "typescript";
import { generateApiFunctionDeclaration } from "./generate-api-operation.js";
import { modem } from "./modem.js";
import type { Config } from "./types.js";
import { blankSourceFile, printer, stringToStatements } from "./utils.js";

export const handler: Plugin.LegacyHandler<Config> = ({
	files,
	plugin,
	client,
	openApi,
}) => {
	const importSet = new Set<string>();

	const fnDeclarations: (
		| ts.FunctionDeclaration
		| ts.JSDoc
		| ts.InterfaceDeclaration
	)[] = [];

	for (const service of client.services) {
		for (const operation of service.operations) {
			for (const typeImport of operation.imports) {
				importSet.add(typeImport);
			}
			if (skipPaths.includes(operation.path)) {
				continue;
			}
			const produces = pathProduces(
				openApi as unknown as FakeOpenApi,
				operation.path,
				operation.method,
			);
			const statusCodes = operation.responses.reduce<
				Record<string, string | boolean>
			>((acc, r) => {
				acc[r.code] =
					String(r.code).startsWith("2") || String(r.code).startsWith("101")
						? true
						: (r.description ?? "");
				return acc;
			}, {});

			let bodyType: string | undefined;

			const filter = ["query", "body", "headers", "path"];
			const withoutDataInterfaces =
				operation.parameters.map((p) => filter.includes(p.in)).length === 0;

			if (operation.parametersBody !== null) {
				if (operation.parametersBody.prop === "inputStream") {
					if (operation.id) {
						bodyType = `MN.${operation.id}Body`;
					}
				}
			}

			const inputType = `GT.${operation.id}Data`;
			const outputType = `GT.${operation.id}Response`;

			const declarationOpts = {
				name: camelCase(operation.id ?? ""),
				inputType: withoutDataInterfaces ? "NoData" : inputType,
				outputType,
				path: operation.path,
				stream: stream(produces),
				options:
					operation.parametersQuery.length !== 0
						? operation.parametersBody !== null
							? ("query-body" as const)
							: ("query" as const)
						: operation.parametersBody !== null
							? ("body" as const)
							: null,
				headers: operation.parametersHeader.length !== 0,
				hijack: false, // Change only for tty
				method: operation.method.toUpperCase(),
				statusCodes: statusCodes,
				summary: operation.summary,
				description: operation.description,
				bodyType: bodyType,
			};
			const fn = generateApiFunctionDeclaration(declarationOpts);
			const fnComments = [
				operation.summary,
				operation.description,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				((operation as any).tags ?? [])
					.map((s: string) => `@category ${s}`)
					.join("\n"),
			]
				.filter((e) => e !== null)
				.join("\n\n");

			const jsdoc = ts.factory.createJSDocComment(
				ts.factory.createNodeArray([
					ts.factory.createJSDocText(`${fnComments}`),
				]),
				undefined,
			);

			const printedComments = printer
				.printNode(ts.EmitHint.Unspecified, jsdoc, blankSourceFile())
				.replace("/**", "*")
				.replace("*/", "\n")
				.replace("*  */", "");

			ts.addSyntheticLeadingComment(
				fn,
				// declarationOpts.stream ? fn : fnOverload1,
				ts.SyntaxKind.MultiLineCommentTrivia,
				printedComments,
				true,
			);
			fnDeclarations.push(fn);
		}
	}

	const sdkFile = files[plugin.output]!;
	sdkFile.add(...stringToStatements('import * as GT from "./types.gen.js";'));
	sdkFile.add(...stringToStatements('import * as MN from "../types.man.js";'));
	sdkFile!.add(...modem);
	sdkFile!.add(...fnDeclarations);
	sdkFile.write();
};

type Paths = Record<
	string,
	Record<string, { produces: string[]; consumes: string[] }>
>;

interface FakeOpenApi {
	paths: Paths;
}

function pathProduces(openApi: FakeOpenApi, path: string, method: string) {
	const consumes = openApi.paths[path] ?? {};
	const openApiOperation = consumes[method.toLowerCase()];
	return (openApiOperation ?? {}).produces;
}

function stream(produces: string[] | undefined) {
	return (
		(produces ?? []).includes("application/vnd.docker.raw-stream") ||
		(produces ?? []).includes("application/vnd.docker.multiplexed-stream")
	);
}

const skipPaths = ["/_ping", "/session"];
