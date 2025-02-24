#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

import groupBy from "object.groupby";
import { generateCronsDockerfile } from "./dockerfile-crons.js";
import { generateTasksDockerfile } from "./dockerfile-tasks.js";

/**
 * Interface for the export data found in a workload file.
 */
interface ExportData {
	type: string;
	id: string;
	schedule?: string;
	serverId?: string;
	file: string;
}

function readWorkloads() {
	const configFile = path.join(process.cwd(), "workloads.config.ts");
	let workloadsDir = "workloads"; // default

	if (fs.existsSync(configFile)) {
		const configPath = workloadsPathFromConfig(configFile);
		if (configPath) {
			workloadsDir = configPath;
		}
	}

	const absoluteWorkloadsDir = path.resolve(process.cwd(), workloadsDir);

	if (
		!fs.existsSync(absoluteWorkloadsDir) ||
		!fs.statSync(absoluteWorkloadsDir).isDirectory()
	) {
		console.error(`Error: ${absoluteWorkloadsDir} is not a valid directory.`);
		process.exit(1);
	}

	const tsFiles = getFilesRecursively(absoluteWorkloadsDir, ".ts");
	const allExports: ExportData[] = [];

	tsFiles.forEach((file) => {
		const exportsFromFile = processFile(file);
		allExports.push(...exportsFromFile);
	});

	const result = groupBy(allExports, ({ type }) => type);

	const secRes = Object.entries(result).reduce<
		Record<string, Partial<Record<string, ExportData[]>>>
	>((acc, record) => {
		const lala = groupBy(record[1]!, ({ serverId, id }) => `${serverId ?? id}`);
		acc[record[0]] = lala;
		return acc;
	}, {});
	const tasks = secRes["Task"];
	if (tasks) {
		const tasksFiles = Object.values(tasks)
			.filter((v) => v !== undefined)
			.flatMap((t) => t)
			.map((t) => t.file);
		const dockerFile = generateTasksDockerfile(tasksFiles);
		fs.writeFileSync("./tasks.Dockerfile", dockerFile.toString());
	}
	const crons = secRes["Cron"];
	if (crons) {
		const cronsFiles = Object.values(crons)
			.filter((v) => v !== undefined)
			.flatMap((t) => t)
			.map((t) => ({ id: t.id, file: t.file }));
		const dockerFile = generateCronsDockerfile(cronsFiles);
		fs.writeFileSync("./crons.Dockerfile", dockerFile.toString());
	}

	console.log(JSON.stringify(secRes, null, 2));
}

/**
 * Recursively get all files with a given extension from a directory.
 */
function getFilesRecursively(dir: string, extension: string = ".ts"): string[] {
	let results: string[] = [];
	const list = fs.readdirSync(dir);
	list.forEach((fileOrDir) => {
		const fullPath = path.join(dir, fileOrDir);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			results = results.concat(getFilesRecursively(fullPath, extension));
		} else if (fullPath.endsWith(extension)) {
			results.push(fullPath);
		}
	});
	return results;
}

/**
 * Process a NewExpression (e.g. new Cron("reports", { schedule: "* * * * *" })
 * or new Redis("tokens", ...)) to extract export data.
 */
function processNewExpression(
	expr: ts.NewExpression,
	filePath: string,
	foundExports: ExportData[],
): void {
	if (ts.isIdentifier(expr.expression)) {
		const typeName = expr.expression.text;
		const args = expr.arguments;
		if (args && args.length >= 1) {
			const idArg = args[0];
			if (idArg !== undefined) {
				if (ts.isStringLiteral(idArg)) {
					const exportData: ExportData = {
						type: typeName,
						id: idArg.text,
						file: `./${path.relative(".", filePath)}`,
					};

					if (
						typeName === "PostgresDatabase" ||
						typeName === "MySqlDatabase" ||
						typeName === "MongoDatabase"
					) {
						const configArg = args[1];
						if (configArg) {
							if (ts.isObjectLiteralExpression(configArg)) {
								configArg.properties.forEach((prop) => {
									if (ts.isPropertyAssignment(prop)) {
										let propName: string | undefined;
										if (ts.isIdentifier(prop.name)) {
											propName = prop.name.text;
										} else if (ts.isStringLiteral(prop.name)) {
											propName = prop.name.text;
										}
										if (
											propName === "serverId" &&
											ts.isStringLiteral(prop.initializer)
										) {
											exportData.serverId = prop.initializer.text;
										}
									}
								});
							}
						}
					}

					// For Cron objects, attempt to extract the schedule property from the second argument.
					if (typeName === "Cron" && args.length >= 2) {
						const configArg = args[1];
						if (configArg) {
							if (ts.isObjectLiteralExpression(configArg)) {
								configArg.properties.forEach((prop) => {
									if (ts.isPropertyAssignment(prop)) {
										let propName: string | undefined;
										if (ts.isIdentifier(prop.name)) {
											propName = prop.name.text;
										} else if (ts.isStringLiteral(prop.name)) {
											propName = prop.name.text;
										}
										if (
											propName === "schedule" &&
											ts.isStringLiteral(prop.initializer)
										) {
											exportData.schedule = prop.initializer.text;
										}
									}
								});
							}
						}
					}
					foundExports.push(exportData);
				}
			}
		}
	}
}

/**
 * For a given identifier name, search top-level variable declarations
 * to find one whose initializer is a NewExpression.
 */
function findVariableInitializer(
	sourceFile: ts.SourceFile,
	name: string,
): ts.NewExpression | undefined {
	let found: ts.NewExpression | undefined;
	sourceFile.statements.forEach((statement) => {
		if (ts.isVariableStatement(statement)) {
			statement.declarationList.declarations.forEach((declaration) => {
				if (
					ts.isIdentifier(declaration.name) &&
					declaration.name.text === name &&
					declaration.initializer &&
					ts.isNewExpression(declaration.initializer)
				) {
					found = declaration.initializer;
				}
			});
		}
	});
	return found;
}

/**
 * Parse a single file to extract export data.
 */
function processFile(filePath: string): ExportData[] {
	const foundExports: ExportData[] = [];
	const fileContents = fs.readFileSync(filePath, "utf-8");
	const sourceFile = ts.createSourceFile(
		filePath,
		fileContents,
		ts.ScriptTarget.Latest,
		/*setParentNodes*/ true,
	);

	/**
	 * Traverse the AST and handle:
	 * - Export default assignments.
	 * - Exported variable declarations.
	 */
	function visit(node: ts.Node) {
		// Handle default exports: export default ...
		if (ts.isExportAssignment(node) && !node.isExportEquals) {
			const expr = node.expression;
			if (ts.isNewExpression(expr)) {
				// Case: export default new Cron(...)
				processNewExpression(expr, filePath, foundExports);
			} else if (ts.isIdentifier(expr)) {
				// Case: export default <identifier>
				const initializer = findVariableInitializer(sourceFile, expr.text);
				if (initializer) {
					processNewExpression(initializer, filePath, foundExports);
				}
			}
		}

		// Handle named exports: e.g. export const tokensKV = new Redis("tokens", …)
		if (ts.isVariableStatement(node)) {
			if (
				node.modifiers &&
				node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
			) {
				node.declarationList.declarations.forEach((declaration) => {
					if (
						declaration.initializer &&
						ts.isNewExpression(declaration.initializer)
					) {
						processNewExpression(
							declaration.initializer,
							filePath,
							foundExports,
						);
					}
				});
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return foundExports;
}

/**
 * Extract the workloadsPath from a configuration file.
 *
 * The configuration file should export an object as default with a property
 * named "workloadsPath"
 */
function workloadsPathFromConfig(configFilePath: string) {
	// Read the file content
	const sourceCode = ts.sys.readFile(configFilePath);
	if (!sourceCode) {
		console.error(`Could not read file: ${configFilePath}`);
		return;
	}

	// Create a SourceFile object
	const sourceFile = ts.createSourceFile(
		configFilePath,
		sourceCode,
		ts.ScriptTarget.Latest,
		true,
	);

	// Object to hold the extracted information
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const extractedData: { [key: string]: any } = {};

	// Function to visit each node in the AST
	function visit(node: ts.Node) {
		// Check for variable declarations
		if (
			ts.isVariableDeclaration(node) &&
			node.name.getText() === "workloadsConfig"
		) {
			const initializer = node.initializer;
			if (initializer && ts.isObjectLiteralExpression(initializer)) {
				// Extract properties from the object literal
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const properties: { [key: string]: any } = {};
				initializer.properties.forEach((prop) => {
					if (ts.isPropertyAssignment(prop)) {
						properties[prop.name.getText()] = prop.initializer.getText();
					}
				});
				extractedData.workloadsConfig = properties;
			}
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return extractedData.workloadsConfig.workloadsPath.replace(/"/g, "");
}

readWorkloads();
