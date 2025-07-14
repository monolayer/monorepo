import cronParser from "cron-parser";
import { StatelessWorkload } from "~workloads/workloads/stateless/stateless-workload.js";

export interface CronOptions {
	/**
	 * Function with the code that will be executed.
	 */
	run: () => Promise<void>;
	/**
	 * Schedule in crontab format.
	 */
	schedule: string;
}

/**
 * Workload for recurring tasks.
 *
 * A Cron workload is initialized with a unique id and the following options:
 *
 * - `schedule` in [unix-cron](https://man7.org/linux/man-pages/man5/crontab.5.html)
 * format to specify when it should run.
 *
 * - `run` function with the code that will be executed.
 *
 * @example
 * ```ts
 * import { Cron } from "@monolayer/sdk";
 *
 * const reports = new Cron("reports", {
 *   schedule: "* * * * *",
 *   run: async () => {
 *     // Do something;
 *   },
 * });
 *
 * export default reports;
 * ```
 */
export class Cron extends StatelessWorkload {
	/**
	 * @internal
	 */
	declare _brand: "cron";

	run: () => Promise<void>;
	schedule: string;

	constructor(
		/**
		 * Unique ID
		 */
		public id: string,
		public options: CronOptions,
	) {
		super(id);
		this.run = options.run;
		this.schedule = parseSchedule(options.schedule);
	}
}

function parseSchedule(schedule: string) {
	try {
		const parsed = cronParser.parseExpression(schedule);
		return parsed.stringify();
	} catch {
		throw new Error(`Failed to parse schedule: ${schedule}`);
	}
}
