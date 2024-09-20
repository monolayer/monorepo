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

function isSMTPMailer(obj: unknown): obj is SMTPMailer {
	return (obj as any).constructor?.name === "SMTPMailer";
}

function isSESMailer(obj: unknown): obj is SESMailer {
	return (obj as any).constructor?.name === "SESMailer";
}

function isRedisStore(obj: unknown): obj is RedisStore {
	return (obj as any).constructor?.name === "RedisStore";
}

function isMemcachedStore(obj: unknown): obj is MemcachedStore {
	return (obj as any).constructor?.name === "MemcachedStore";
}

function isPostgreSQLDatabase(obj: unknown): obj is PostgreSQLDatabase {
	return (obj as any).constructor?.name === "PostgreSQLDatabase";
}
