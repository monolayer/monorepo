import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

export const monolayerTemplate = nunjucks.compile(`export default {
	folder: "db"
};
`);

export const configurationsTemplate =
	nunjucks.compile(`import { dbSchema } from "./schema";

export default {
	schemas: [dbSchema],
	environments: {
		development: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_ONE_PORT},
			database: "{{ dbName }}",
		},
		test: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_TWO_PORT},
			database: "{{ dbName }}_test",
		},
	},
};

export const stats = {
	environments: {
		development: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_ONE_PORT},
			database: "{{ dbName }}_stats",
		},
		test: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_TWO_PORT},
			database: "{{ dbName }}_stats_test",
		},
	},
};
`);

export const configurationsTemplateTwoDatabaseSchemas =
	nunjucks.compile(`import { dbSchema } from "./schema";

import { dbSchema as anotherDbSchema } from "./{{ secondSchemaFile }}";

export default {
	schemas: [dbSchema, anotherDbSchema],
	environments: {
		development: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_ONE_PORT},
			database: "{{ dbName }}",
		},
		test: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_TWO_PORT},
			database: "{{ dbName }}_test",
		},
	},
};

export const stats =  {
	environments: {
		development: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_ONE_PORT},
			database: "{{ dbName }}_stats",
		},
		test: {
			user: "${process.env.POSTGRES_USER}",
			password: "${process.env.POSTGRES_PASSWORD}",
			host: "${process.env.POSTGRES_HOST}",
			port: ${process.env.POSTGRES_TWO_PORT},
			database: "{{ dbName }}_stats_test",
		},
	},
};
`);
