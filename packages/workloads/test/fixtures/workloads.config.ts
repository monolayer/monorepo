import type { Configuration } from "./../../src/configuration.js";

const config: Configuration = {
	workloadsPath: "src/workloads",
	containers: {
		postgresDatabase: {
			exposedPorts: [{ container: 5432, host: 7010 }],
		},
		redis: {
			exposedPorts: [{ container: 6379, host: 7011 }],
		},
		mySqlDatabase: {
			exposedPorts: [{ container: 3306, host: 7013 }],
		},
		localStack: {
			exposedPorts: [{ container: 4566, host: 7017 }],
	},
};

export default config;
