import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import { DigitalOceanStatefulWorkload } from "../../digital-ocean";

export interface DOMongoDbConfig {
	vpcId: pulumi.Output<string>;
	region: string;
	appName: string;
}

export class DOMongoDb extends DigitalOceanStatefulWorkload<DOMongoDbConfig> {
	clusterArgs(workloadId: string) {
		return {
			name: `${workloadId}-cluster`,
			engine: "mongodb",
			version: "6",
			size: digitalocean.DatabaseSlug.DB_1VPCU1GB,
			region: this.config.region,
			nodeCount: 1,
			privateNetworkUuid: this.config.vpcId,
			tags: [this.config.appName],
		};
	}
}
