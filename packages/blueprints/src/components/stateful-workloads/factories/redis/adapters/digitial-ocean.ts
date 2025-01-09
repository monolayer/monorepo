import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import { DigitalOceanStatefulWorkload } from "../../digital-ocean";

export interface DORedisConfig {
	vpcId: pulumi.Output<string>;
	region: string;
	appName: string;
}

export class DORedis extends DigitalOceanStatefulWorkload<DORedisConfig> {
	clusterArgs(workloadId: string) {
		return {
			name: `${workloadId}-cluster`,
			engine: "redis",
			version: "7",
			size: digitalocean.DatabaseSlug.DB_1VPCU1GB,
			region: this.config.region,
			nodeCount: 1,
			privateNetworkUuid: this.config.vpcId,
			tags: [this.config.appName],
		};
	}
}
