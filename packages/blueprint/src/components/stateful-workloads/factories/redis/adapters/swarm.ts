import type { TaskSpec } from "@monolayer/dsdk";
import { SwarmStatefulWorkload } from "../../swarm";
// "./../../swarm-stateful-workload";
export interface SwarmRedisConfig {
	appName: string;
	registryAuth?: string;
}

export class SwarmRedis extends SwarmStatefulWorkload<SwarmRedisConfig> {
	spec(workloadId: string): TaskSpec {
		return {
			ContainerSpec: {
				Image: "redis:7.4-alpine3.20",
				Env: ['REDIS_ARGS="--save 1 1 --appendonly yes"'],
				HealthCheck: {
					Test: ["CMD", "redis-cli", "ping"],
					Interval: 10000 * 1000000,
					Timeout: 5000 * 1000000,
					Retries: 5,
					StartPeriod: 1000 * 1000000,
				},
				Mounts: [
					{
						Type: "volume",
						Source: `redis-${workloadId}-data`,
						Target: "/data",
					},
				],
			},
		};
	}
}
