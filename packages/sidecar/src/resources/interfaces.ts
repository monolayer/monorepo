export interface GenericResource {
	/**
	 * Unique ID
	 */
	readonly id: string;
}

export interface ResourceClient<C> {
	client: C;
}

export interface SerializableStatic {
	fromObject: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function staticImplements<T>(ctor: T) {}
