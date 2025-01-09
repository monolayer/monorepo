import type { TaskSpec } from "@monolayer/dsdk";
import { SwarmStatefulWorkload } from "../../swarm";

export interface SwarmElasticConfig {
	appName: string;
	registryAuth?: string;
}

export class SwarmElastic extends SwarmStatefulWorkload<SwarmElasticConfig> {
	spec(workloadId: string): TaskSpec {
		return {
			ContainerSpec: {
				Image: "elasticsearch:7.17.25",
				Env: ['"discovery.type"="single-node"'],
				HealthCheck: {
					Test: ["CMD-SHELL", "curl --silent --fail localhost:9200/_cluster/health || exit 1"],
					Interval: 10000 * 1000000,
					Timeout: 5000 * 1000000,
					Retries: 5,
					StartPeriod: 1000 * 1000000,
				},
				Mounts: [
					{
						Type: "volume",
						Source: `elastic-${workloadId}-data`,
						Target: "/usr/share/elasticsearch/data",
					},
				],
			},
		};
	}
}
