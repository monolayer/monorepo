import cronParser from "cron-parser";
import { StatelessWorkload } from "~workloads/workloads/stateless/stateless-workload.js";

export interface CronOptions {
	/**
	 * TDB.
	 */
	work: () => Promise<void> | void;
	/**
	 * Schedule in crontab format.
	 */
	schedule: string;
}

/**
 * Workload for scheduled tasks.
 */
export class Cron extends StatelessWorkload {
	/**
	 * @internal
	 */
	declare _brand: "cron";

	work: () => Promise<void> | void;
	schedule: string;

	constructor(
		/**
		 * Unique ID
		 */
		public id: string,
		public options: CronOptions,
	) {
		super(id);
		this.work = options.work;
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
