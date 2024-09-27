import fs from "node:fs/promises";
import path from "node:path";
import { Container } from "~resources/_lib/container.js";
import { PostgreSQLDatabase } from "~resources/databases/postgresql/postgresql.js";
import { MemcachedStore } from "~resources/key-value-stores/memcached/store.js";
import { RedisStore } from "~resources/key-value-stores/redis/store.js";
import { SESMailer } from "~resources/mailers/ses/ses.js";
import { SMTPMailer } from "~resources/mailers/smtp/smtp.js";
import { removeEnvVar } from "~resources/write-env.js";

export async function startResources(folderPath: string) {
	const resources = await importResources(folderPath);
	await start(resources);
}

export async function startResourcesAt(filePath: string) {
	const resources = await importResourcesAt(filePath);
	await start(resources);
}

async function start(resources: unknown[]) {
	if (resources !== undefined) {
		for (const resource of resources) {
			if (isSMTPMailer(resource)) {
				await resource.container.startPersisted();
			}
			if (isSESMailer(resource)) {
				await resource.container.startPersisted();
			}
			if (isRedisStore(resource)) {
				await resource.container.startPersisted();
			}
			if (isMemcachedStore(resource)) {
				await resource.container.startPersisted();
			}
			if (isPostgreSQLDatabase(resource)) {
				await resource.container.startPersisted();
			}
		}
	}
}

export async function stopResources(folderPath: string) {
	const resources = await importResources(folderPath);
	await stop(resources);
}

export async function stopResourcesAt(filePath: string) {
	const resources = await importResourcesAt(filePath);
	await stop(resources);
}

export async function stop(resources: unknown[]) {
	if (resources !== undefined) {
		for (const resource of resources) {
			if (isSMTPMailer(resource)) {
				await Container.stop(resource.container);
				await removeEnvVar(resource.credentialsEnvVar);
			}
			if (isSESMailer(resource)) {
				await Container.stop(resource.container);
				await removeEnvVar(resource.connectionStringEnvVarName);
			}
			if (isRedisStore(resource)) {
				await Container.stop(resource.container);
				await removeEnvVar(resource.credentialsEnvVar);
			}
			if (isMemcachedStore(resource)) {
				await Container.stop(resource.container);
				await removeEnvVar(resource.credentialsEnvVar);
			}
			if (isPostgreSQLDatabase(resource)) {
				await Container.stop(resource.container);
				await removeEnvVar(resource.credentialsEnvVar);
				await removeEnvVar(resource.monoPgCredentialsEnvVar);
			}
		}
	}
}

export async function importResources(folderPath: string) {
	const files = await fs.readdir(folderPath, { recursive: true });
	return files.reduce<Promise<unknown[]>>(async (previousPromise, fileName) => {
		let acc = await previousPromise;
		if (
			(fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) ||
			(fileName.endsWith(".mts") && !fileName.endsWith(".d.mts"))
		) {
			acc = [
				...acc,
				...Object.values(await import(path.join(folderPath, fileName))),
			];
		}
		return acc;
	}, Promise.resolve([]));
}

export async function importResourcesAt(filePath: string) {
	return Object.values(await import(filePath));
}

function isSMTPMailer(obj: unknown): obj is SMTPMailer {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (obj as any).constructor?.name === "SMTPMailer";
}

function isSESMailer(obj: unknown): obj is SESMailer {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (obj as any).constructor?.name === "SESMailer";
}

function isRedisStore(obj: unknown): obj is RedisStore {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (obj as any).constructor?.name === "RedisStore";
}

function isMemcachedStore(obj: unknown): obj is MemcachedStore {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (obj as any).constructor?.name === "MemcachedStore";
}

function isPostgreSQLDatabase(obj: unknown): obj is PostgreSQLDatabase {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (obj as any).constructor?.name === "PostgreSQLDatabase";
}
