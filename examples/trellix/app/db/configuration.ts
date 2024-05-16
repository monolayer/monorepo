import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";
import { dbExtensions } from "./extensions";
import dotenv from "dotenv";

dotenv.config();

export default {
  schemas: [dbSchema],
  extensions: dbExtensions,
  connections: {
    development: {
      connectionString: process.env.DEV_DATABASE_URL,
    },
    production: {
      connectionString: process.env.DATABASE_URL,
    },
  },
  camelCasePlugin: {
    enabled: false,
  },
} satisfies Configuration;
