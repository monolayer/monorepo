import type { Pool, QueryResultRow } from "pg";
import { ActionStatus, CommandError, CommandSuccess } from "~/cli/command.js";

export async function pgQueryExecute(pool: Pool, query: string) {
	try {
		await pool.query(query);
		return <CommandSuccess>{
			status: ActionStatus.Success,
		};
	} catch (error) {
		return <CommandError>{
			status: ActionStatus.Error,
			error: error as Error,
		};
	} finally {
		await pool.end();
	}
}

type QueryResultSuccess<T> = {
	status: ActionStatus.Success;
	result: T[];
};

type QueryResultError = {
	status: ActionStatus.Error;
	error: Error;
};

export async function pgQueryExecuteWithResult<T extends QueryResultRow>(
	pool: Pool,
	query: string,
) {
	try {
		const result = await pool.query<T>(query);
		await pool.end();
		return <QueryResultSuccess<T>>{
			status: ActionStatus.Success,
			result: result.rows,
		};
	} catch (error) {
		await pool.end();
		return <QueryResultError>{
			status: ActionStatus.Error,
			error: error as Error,
		};
	}
}
