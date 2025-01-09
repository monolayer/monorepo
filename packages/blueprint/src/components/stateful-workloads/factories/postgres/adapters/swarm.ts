import type { TaskSpec } from "@monolayer/dsdk";
import { SwarmStatefulWorkload } from "../../swarm";

export interface SwarmPostgresConfig {
	appName: string;
	registryAuth?: string;
}

export class SwarmPostgres extends SwarmStatefulWorkload<SwarmPostgresConfig> {
	spec(workloadId: string): TaskSpec {
		return {
			ContainerSpec: {
				Image: "postgres:16-alpine3.20",
				Env: ["POSTGRES_PASSWORD=postgres"],
				HealthCheck: {
					Test: ["CMD", "pg_isready", "-U", "postgres"],
					Interval: 10000 * 1000000,
					Timeout: 5000 * 1000000,
					Retries: 5,
					StartPeriod: 1000 * 1000000,
				},
				Mounts: [
					{
						Type: "volume",
						Source: `postgres-${workloadId}-data`,
						Target: "/var/lib/postgresql/data",
					},
				],
			},
		};
	}
}
