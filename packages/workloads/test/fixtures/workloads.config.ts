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
		elasticSearch: {
			exposedPorts: [{ container: 9200, host: 7012 }],
		},
		mySqlDatabase: {
			exposedPorts: [{ container: 3306, host: 7013 }],
		},
		mailer: {
			exposedPorts: [
				{ container: 1025, host: 7014 },
				{ container: 8025, host: 7015 },
			],
		},
		mongoDb: {
			exposedPorts: [{ container: 27017, host: 7016 }],
		},
		localStack: {
			exposedPorts: [{ container: 4566, host: 7017 }],
		},
	},
};

export default config;
