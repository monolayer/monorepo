export interface Workload {
	/**
	 * Unique ID
	 */
	readonly id: string;
}

export interface StatefulWorkload extends Workload {
	readonly stateful: true;
}

export interface WorkloadClient<C> {
	client: C;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function staticImplements<T>(ctor: T) {}
