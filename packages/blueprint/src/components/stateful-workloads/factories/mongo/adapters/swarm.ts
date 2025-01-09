import type { TaskSpec } from "@monolayer/dsdk";
import { SwarmStatefulWorkload } from "../../swarm";

export interface SwarmMongoDbConfig {
	appName: string;
	registryAuth?: string;
}

export class SwarmMongoDb extends SwarmStatefulWorkload<SwarmMongoDbConfig> {
	spec(workloadId: string): TaskSpec {
		return {
			ContainerSpec: {
				Image: "mongo:7.0.15",
				HealthCheck: {
					Test: ["CMD", "mongosh", "--host", "localhost:27017", "--eval", "1"],
					Interval: 10000 * 1000000,
					Timeout: 5000 * 1000000,
					Retries: 5,
					StartPeriod: 1000 * 1000000,
				},
				Mounts: [
					{
						Type: "volume",
						Source: `mongodb-${workloadId}-data`,
						Target: "/data/db",
					},
				],
			},
		};
	}
}
