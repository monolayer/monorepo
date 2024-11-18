import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";

export async function testMailerURL<C>(mailer: Mailer<C>) {
	const url = new URL(process.env[mailer.connectionStringEnvVar()]!);
	const httpURL = new URL("", "http://base.com");
	httpURL.host = url.host;
	httpURL.port = await mailerWebUIHostPort(mailer);
	return httpURL.toString();
}

async function mailerWebUIHostPort<C>(mailer: Mailer<C>) {
	const container = await getExistingContainer(mailer);
	if (container === undefined) {
		throw new Error(`container for Mailer workload ${mailer.id} not found`);
	}
	const inspect = await container.inspect();
	const ports = inspect.NetworkSettings.Ports;
	return ports["8025/tcp"]![0]!["HostPort"];
}
