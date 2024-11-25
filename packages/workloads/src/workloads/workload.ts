/**
 * @group Abstract Classes
 */
export abstract class Workload {
	/**
	 * Unique ID
	 */
	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	) {
		this.id = id;
	}
}
