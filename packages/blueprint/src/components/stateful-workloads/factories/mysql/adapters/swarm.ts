import type { TaskSpec } from "@monolayer/dsdk";
import { SwarmStatefulWorkload } from "../../swarm";

export interface SwarmMysqlDbConfig {
	appName: string;
	registryAuth?: string;
}

export class SwarmMysql extends SwarmStatefulWorkload<SwarmMysqlDbConfig> {
	spec(workloadId: string): TaskSpec {
		return {
			ContainerSpec: {
				Image: "mysql:8.4.3",
				Env: ['MYSQL_ROOT_PASSWORD="test"'],
				HealthCheck: {
					Test: ["CMD-SHELL", "mysqladmin -h 'localhost' -u root -ptest ping --silent"],
					Interval: 10000 * 1000000,
					Timeout: 5000 * 1000000,
					Retries: 5,
					StartPeriod: 10000 * 1000000,
				},
				Mounts: [
					{
						Type: "volume",
						Source: `mysql-${workloadId}-data`,
						Target: "/var/lib/mysql",
					},
				],
			},
		};
	}
}
