export interface GenericWorkload {
	/**
	 * Unique ID
	 */
	readonly id: string;
}

export interface WorkloadClient<C> {
	client: C;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function staticImplements<T>(ctor: T) {}
