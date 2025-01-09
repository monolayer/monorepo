import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import type { Project } from "../../../project";
import type { Vpc } from "../../../vpc";

export interface DigitalOceanConfig {
	project: Project;
	vpc: Vpc;
	region: string;
}

export class DigitalOcean {
	constructor(public config: DigitalOceanConfig) {}

	deploy(
		certificate: digitalocean.Certificate,
		dropletIds: pulumi.Output<string>[],
		parent?: pulumi.Resource,
	) {
		return new digitalocean.LoadBalancer(
			"default",
			{
				network: "EXTERNAL",
				projectId: this.config.project.project.id,
				vpcUuid: this.config.vpc.vpc.id,
				redirectHttpToHttps: true,
				dropletIds: dropletIds.map((id) => id.apply((id) => Number(id))),
				enableBackendKeepalive: true,
				region: this.config.region,
				size: "lb-small",
				sizeUnit: 1,
				forwardingRules: [
					{
						certificateName: certificate.name,
						entryPort: 443,
						entryProtocol: "https",
						targetPort: 80,
						targetProtocol: "http",
					},
				],
			},
			{ parent },
		);
	}
}
