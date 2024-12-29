export interface BuildManifest {
	version: string;
	framework: string;
	postgresDatabase: DatabaseWorkloadInfo[];
	mySqlDatabase: DatabaseWorkloadInfo[];
	redis: WorkloadInfo[];
	elasticSearch: WorkloadInfo[];
	mongoDb: DatabaseWorkloadInfo[];
	mailer: WorkloadInfo[];
	bucket: BucketInfo[];
	cron: CronInto[];
	task: TaskInfo[];
}

export interface DatabaseWorkloadInfo {
	id: string;
	databases: {
		name: string;
		serverId: string;
		connectionStringEnvVar: string;
	}[];
}

export interface WorkloadInfo {
	id: string;
	connectionStringEnvVar: string;
}

export interface BucketInfo {
	name: string;
}

export interface CronInto {
	id: string;
	path: string;
	entryPoint: string;
	schedule: string;
	dockerfile: string;
}

export interface TaskInfo {
	id: string;
	path: string;
	entryPoint: string;
	dockerfile: string;
}

export const manifestJsonSchema = {
	$schema: "https://json-schema.org/draft/2020-12/schema",
	type: "object",
	$id: "workloads-build-manifest-schema-v1",
	title: "WorkloadsBuildManifest",
	properties: {
		version: {
			type: "string",
			enum: ["1"],
			description:
				"The version of the schema. This must be '1' for version 1 of the schema.",
		},
		framework: {
			type: "string",
			description: "Application framework",
		},
		postgresDatabase: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		mySqlDatabase: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		redis: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
			},
		},
		elasticSearch: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
			},
		},
		mongoDb: {
			type: "array",
			items: {
				$ref: "#/$defs/DatabaseWorkloadInfo",
			},
		},
		mailer: {
			type: "array",
			items: {
				$ref: "#/$defs/WorkloadInfo",
				description: "Array of Mailer",
			},
		},
		bucket: {
			type: "array",
			items: {
				$ref: "#/$defs/BucketInfo",
				description: "Array of Bucket",
			},
		},
		cron: {
			type: "array",
			items: {
				$ref: "#/$defs/CronInfo",
				description: "Array of Cron",
			},
		},
		task: {
			type: "array",
			items: {
				$ref: "#/$defs/TaskInfo",
				description: "Array of Task",
			},
		},
	},
	required: ["framework", "version"],
	optional: [
		"postgresDatabase",
		"mysqlDatabase",
		"redis",
		"elasticSearch",
		"mongoDb",
		"mailer",
		"bucket",
		"cron",
		"task",
	],
	$defs: {
		DatabaseWorkloadInfo: {
			type: "object",
			properties: {
				id: { type: "string" },
				databases: {
					type: "array",
					items: {
						$ref: "#/$defs/Database",
					},
				},
			},
			required: ["id", "databases"],
		},
		Database: {
			type: "object",
			properties: {
				name: { type: "string" },
				serverId: { type: "string" },
				connectionStringEnvVar: { type: "string" },
			},
			required: ["name", "connectionStringEnvVar"],
		},
		WorkloadInfo: {
			type: "object",
			properties: {
				id: {
					type: "string",
				},
				connectionStringEnvVar: {
					type: "string",
				},
			},
			required: ["id", "connectionStringEnvVar"],
		},
		BucketInfo: {
			type: "object",
			properties: {
				name: {
					type: "string",
				},
			},
			required: ["name"],
		},
		CronInfo: {
			type: "object",
			properties: {
				id: {
					type: "string",
				},
				path: {
					type: "string",
				},
				entryPoint: {
					type: "string",
				},
				schedule: {
					type: "string",
				},
				dockerfile: {
					type: "string",
				},
			},
			required: ["id", "path", "entryPoint", "schedule", "dockerfile"],
		},
		TaskInfo: {
			type: "object",
			properties: {
				id: {
					type: "string",
				},
				path: {
					type: "string",
				},
				entryPoint: {
					type: "string",
				},
				dockerfile: {
					type: "string",
				},
			},
			required: ["id", "path", "entryPoint", "dockerfile"],
		},
	},
};
