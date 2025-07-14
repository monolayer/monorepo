/**
 * @module EventEmitter
 * Implements a simple event emitter pattern for handling custom events.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

/**
 * A simple event emitter class that allows for subscribing to, unsubscribing from,
 * and emitting custom events.
 */
export class EventEmitter {
	private listeners: Map<string, Set<Listener>>;

	constructor() {
		this.listeners = new Map();
	}

	/**
	 * Registers a new listener for a specified event.
	 * @param eventName The name of the event to listen for.
	 * @param listener The callback function to be invoked when the event is emitted.
	 */
	on(eventName: string, listener: Listener): void {
		if (!this.listeners.has(eventName)) {
			this.listeners.set(eventName, new Set());
		}
		this.listeners.get(eventName)?.add(listener);
	}

	/**
	 * Removes a registered listener for a specified event.
	 * @param eventName The name of the event to remove the listener from.
	 * @param listener The callback function to be removed.
	 */
	off(eventName: string, listener: Listener): void {
		if (this.listeners.has(eventName)) {
			this.listeners.get(eventName)?.delete(listener);
		}
	}

	/**
	 * Emits an event, invoking all registered listeners for that event.
	 * @param eventName The name of the event to emit.
	 * @param args Any arguments to pass to the listeners.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	emit(eventName: string, ...args: any[]): void {
		if (this.listeners.has(eventName)) {
			// Create a shallow copy to prevent issues if listeners modify the set during iteration
			const listenersToCall = Array.from(this.listeners.get(eventName)!);
			for (const listener of listenersToCall) {
				listener(...args);
			}
		}
	}
}
