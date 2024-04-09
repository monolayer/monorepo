import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

export const yountConfigTemplate = nunjucks.compile(`export default {
	folder: "db"
};
`);

export const connectorsTemplate =
	nunjucks.compile(`import { database } from "./schema";

export const connectors = {
	default: {
		databaseSchema: database,
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
	},
	stats: {
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
	},
};
`);
