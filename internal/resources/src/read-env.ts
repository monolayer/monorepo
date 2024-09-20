import dotenv from "dotenv";
import path from "node:path";
import { cwd } from "node:process";

export function readEnvVar(envVarName: string) {
	const envObj: Record<string, string> = {};
	dotenv.config({ path: path.join(cwd(), ".env.f4"), processEnv: envObj });
	return envObj[envVarName] ?? process.env[envVarName] ?? "";
}
