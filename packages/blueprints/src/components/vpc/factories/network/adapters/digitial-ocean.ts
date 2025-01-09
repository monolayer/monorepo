import * as digitalocean from "@pulumi/digitalocean";
import type { CustomResourceOptions } from "@pulumi/pulumi";

export interface DigitalOceanNetworkConfig {
	region: string;
}

export class DigitalOceanNetwork {
	constructor(public config: DigitalOceanNetworkConfig) {}

	deploy(opts: {
		name: string;
		vpcIpRange: string;
		id?: string;
		pulumiResourceOptions?: CustomResourceOptions;
	}) {
		return new digitalocean.Vpc(
			opts.id ?? "app-vpc",
			{
				name: opts.name,
				region: this.config.region,
				ipRange: opts.vpcIpRange,
			},
			{ ...(opts.pulumiResourceOptions ?? {}) },
		);
	}
}
