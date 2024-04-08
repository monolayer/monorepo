import dotenv from "dotenv";
import nunjucks from "nunjucks";
dotenv.config();

export const yountConfigTemplate = nunjucks.compile(`export default {
	folder: "db"
};
`);

export const connectionsTemplate =
	nunjucks.compile(`export const connections = {
	default: {
		environments: {
			development: {
				user: "${process.env.POSTGRES_USER}",
				password: "${process.env.POSTGRES_PASSWORD}",
				host: "${process.env.POSTGRES_HOST}",
				port: ${process.env.POSTGRES_PORT ?? 5432},
				database: "{{ dbName }}",
			},
		},
	},
};
`);
