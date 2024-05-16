import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";
import { dbExtensions } from "./extensions";

export default {
	schemas: [dbSchema],
	extensions: dbExtensions,
	connections: {
		development: {
			// With credentials
			database: "#database_development",
			user: "#user",
			password: "#password",
			host: "#host",
			port: 5432,
			// With connection string
			// connectionString: "#connection_string",
		},
		production: {
			connectionString: process.env.DATABASE_URL,
		}
	},
	camelCasePlugin: {
		enabled: false,
	},
} satisfies Configuration;
