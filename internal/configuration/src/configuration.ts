import { type ClientConfig, type PoolConfig } from "pg";

export type PgConfig = ClientConfig & PoolConfig;

export type Monolayer = {
	folder: string;
};
