import { Project } from "ts-morph";

/**
 * Adds a named import to a TypeScript file.
 *
 * @param filePath The path to the file to modify.
 * @param moduleSpecifier The module to import from (e.g., "react").
 * @param namedImport The named import to add (e.g., "useState").
 */
export async function addImport(
	filePath: string,
	moduleSpecifier: string,
	namedImport: string,
) {
	const project = new Project();
	const sourceFile = project.addSourceFileAtPath(filePath);

	// This is a simple way to add an import.
	// ts-morph is smart about merging with existing imports from the same module.
	sourceFile.addImportDeclaration({
		moduleSpecifier,
		namedImports: [namedImport],
	});

	// Save the changes back to the file system.
	await sourceFile.save();
}

/**
 * Adds a named import to a TypeScript file.
 *
 * @param filePath The path to the file to modify.
 * @param moduleSpecifier The module to import from (e.g., "react").
 * @param defaultImport The default import to add.
 */
export async function addDefaultImport(
	filePath: string,
	moduleSpecifier: string,
	defaultImport: string,
) {
	const project = new Project();
	const sourceFile = project.addSourceFileAtPath(filePath);

	// This is a simple way to add an import.
	// ts-morph is smart about merging with existing imports from the same module.
	sourceFile.addImportDeclaration({
		moduleSpecifier,
		defaultImport,
	});

	// Save the changes back to the file system.
	await sourceFile.save();
}
