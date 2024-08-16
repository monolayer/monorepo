/**
 * The MIT License (MIT)
 * Copyright (c) 2022 Sami Koskimäki
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Migration, MigrationProvider } from "./migrator.js";

export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ShallowRecord<K extends keyof any, T> = DrainOuterGeneric<{
	[P in K]: T;
}>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isFunction(obj: unknown): obj is Function {
	return typeof obj === "function";
}

export function isObject(obj: unknown): obj is ShallowRecord<string, unknown> {
	return typeof obj === "object" && obj !== null;
}

/**
 * Reads all migrations from a folder in node.js.
 *
 * ### Examples
 *
 * ```ts
 * import { promises as fs } from 'fs'
 * import path from 'path'
 *
 * new FileMigrationProvider({
 *   fs,
 *   path,
 *   migrationFolder: 'path/to/migrations/folder'
 * })
 * ```
 */
export class FileMigrationProvider implements MigrationProvider {
	readonly #props: FileMigrationProviderProps;

	constructor(props: FileMigrationProviderProps) {
		this.#props = props;
	}

	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {};
		const files = await this.#props.fs.readdir(this.#props.migrationFolder);

		for (const fileName of files) {
			if (
				fileName.endsWith(".js") ||
				(fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) ||
				fileName.endsWith(".mjs") ||
				(fileName.endsWith(".mts") && !fileName.endsWith(".d.mts"))
			) {
				const migration = await import(
					/* webpackIgnore: true */ this.#props.path.join(
						this.#props.migrationFolder,
						fileName,
					)
				);
				const migrationKey = fileName.substring(0, fileName.lastIndexOf("."));

				// Handle esModuleInterop export's `default` prop...
				if (isMigration(migration?.default)) {
					migrations[migrationKey] = migration.default;
				} else if (isMigration(migration)) {
					migrations[migrationKey] = migration;
				}
			}
		}

		return migrations;
	}
}

function isMigration(obj: unknown): obj is Migration {
	return isObject(obj) && isFunction(obj.up);
}

export interface FileMigrationProviderFS {
	readdir(path: string): Promise<string[]>;
}

export interface FileMigrationProviderPath {
	join(...path: string[]): string;
}

export interface FileMigrationProviderProps {
	fs: FileMigrationProviderFS;
	path: FileMigrationProviderPath;
	migrationFolder: string;
}
