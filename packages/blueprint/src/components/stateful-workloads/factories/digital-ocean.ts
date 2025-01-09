import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";

export abstract class DigitalOceanStatefulWorkload<
	T extends {
		vpcId: pulumi.Output<string>;
		appName: string;
		region: string;
	},
> {
	config: T;

	constructor(config: T) {
		this.config = config;
	}

	deploy(workloadId: string, resourceOptions?: pulumi.CustomResourceOptions) {
		const cluster = new digitalocean.DatabaseCluster(workloadId, this.clusterArgs(workloadId), {
			...(resourceOptions ? resourceOptions : {}),
		});
		new digitalocean.DatabaseFirewall(
			`${workloadId}-cluster-fw`,
			{
				clusterId: cluster.id,
				rules: [
					{
						type: "tag",
						value: "worker-node",
					},
					{
						type: "tag",
						value: "manager-node",
					},
				],
			},
			{ parent: cluster },
		);

		return cluster;
	}

	abstract clusterArgs(workloadId: string): digitalocean.DatabaseClusterArgs;
}
