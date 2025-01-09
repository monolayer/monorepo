import { withContext } from "@monolayer/dsdk";
import { createContext, deleteContext } from "./docker-objects";

export async function withTemporaryContext(
	name: string,
	ipAddr: string,
	callback: () => void | Promise<void>,
) {
	try {
		await createContext(name, `ssh://root@${ipAddr}`, "DockerSwarmProvider Context");
		await withContext(name, callback);
		await deleteContext(name);
	} catch (e: any) {
		await deleteContext(name);
		if (e.level === "client-authentication") {
			const check = process.env.SSH_AUTH_SOCK !== undefined ? "Check your ssh-agent." : "";
			throw new Error(
				`ssh error: All configured authentication methods failed for ssh://root@${ipAddr}. ${check}`,
			);
		} else {
			throw e;
		}
	}
}
