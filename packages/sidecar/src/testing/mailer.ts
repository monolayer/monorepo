import { getContainerRuntimeClient } from "testcontainers";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~sidecar/containers/container.js";
import type { Mailer } from "~sidecar/workloads/stateful/mailer.js";

export async function testMailerURL<C>(mailer: Mailer<C>) {
	const url = new URL(process.env[mailer.connectionStringEnvVar()]!);
	const httpURL = new URL("", "http://base.com");
	httpURL.host = url.host;
	httpURL.port = await mailerWebUIHostPort(mailer.id);
	return httpURL.toString();
}

async function getMailerContainer(mailerId: string) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const container = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_WORKLOAD_ID,
		`mailer-${mailerId}`,
		{ status: ["running"] },
	);
	if (container === undefined) {
		throw new Error(`Container for mailer ${mailerId} not found`);
	}
	return container;
}

async function mailerWebUIHostPort(mailerId: string) {
	const container = await getMailerContainer(mailerId);
	const inspect = await container.inspect();
	const ports = inspect.NetworkSettings.Ports;
	return ports["8025/tcp"]![0]!["HostPort"];
}
