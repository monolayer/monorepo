export abstract class Factory<A extends Record<keyof A, Config>> {
	private static instanceMap = new Map<string, any>();

	static instance<T extends Factory<any>>(this: new () => T): T {
		const className = this.name;
		const instanceMap = (this as unknown as typeof Factory).instanceMap;
		if (!instanceMap.has(className)) {
			instanceMap.set(className, new this());
		}
		return instanceMap.get(className);
	}

	#adapters: Map<keyof A, (config: A[keyof A]["config"]) => A[keyof A]> = new Map();

	register<T extends keyof A>(
		type: T,
		creator: (config: A[T]["config"]) => T extends keyof A ? A[T] : never,
	) {
		const instance = (this.constructor as any).instance();
		return instance.#adapters.set(String(type), creator as any);
	}

	adapter<T extends keyof A>(type: T, config: A[T]["config"]) {
		const creator = this.#adapters.get(type);
		if (!creator) {
			throw new Error(`No adapter registered for type: ${String(type)}`);
		}
		return creator(config) as T extends keyof A ? A[T] : never;
	}
}

export abstract class FactoryWithoutConfig<A extends Record<keyof A, any>> {
	private static instanceMap = new Map<string, any>();

	static instance<T extends FactoryWithoutConfig<any>>(this: new () => T): T {
		const className = this.name;
		const instanceMap = (this as unknown as typeof FactoryWithoutConfig).instanceMap;
		if (!instanceMap.has(className)) {
			instanceMap.set(className, new this());
		}
		return instanceMap.get(className);
	}

	#adapters: Map<keyof A, () => A[keyof A]> = new Map();

	register<T extends keyof A>(type: T, creator: () => T extends keyof A ? A[T] : never) {
		const instance = (this.constructor as any).instance();
		return instance.#adapters.set(String(type), creator as any);
	}

	adapter<T extends keyof A>(type: T) {
		const creator = this.#adapters.get(type);
		if (!creator) {
			throw new Error(`No adapter registered for type: ${String(type)}`);
		}
		return creator() as T extends keyof A ? A[T] : never;
	}
}

export type Config = { config: unknown };

export type AdapterWithConfigAndPorts<P, T extends Config & P> = T;

export type AdapterWithPorts<P, T extends P> = T;
