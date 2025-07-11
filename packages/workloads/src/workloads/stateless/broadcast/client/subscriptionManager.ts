/**
 * @module SubscriptionManager
 * Manages subscriptions to channels in the AWS AppSync Events API.
 */

import { v4 as uuidv4 } from "uuid";
import type { EventEmitter } from "./eventEmitter.js";
import { buildSubscribeMessage } from "./messageBuilder.js";
import { AppSyncWebSocketMessage } from "./types.js";

type SubscriberCallback = (data: object) => void;

type SubscriptionPromiseResolvers = {
	resolve: () => void;
	reject: (error: Error) => void;
	promise: Promise<void>;
};

/**
 * Represents a manager for handling subscriptions to various channels.
 * It interacts with a connection manager to send subscription messages.
 */
export class SubscriptionManager {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private connectionManager: any; // Will be typed more strictly later
	private subscribers: Map<string, SubscriberCallback>;
	private subscriptionPromises: Map<string, SubscriptionPromiseResolvers>;

	/**
	 * Creates an instance of SubscriptionManager.
	 * @param connectionManager The connection manager responsible for sending messages.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(connectionManager: any, eventEmitter: EventEmitter) {
		this.connectionManager = connectionManager;
		this.subscribers = new Map();
		this.subscriptionPromises = new Map();
		// Register a handler for incoming messages from the ConnectionManager
		eventEmitter.on("message", (message: AppSyncWebSocketMessage) => {
			switch (message.type) {
				case "data":
					console.log("data", message);
					if (this.subscribers.get(message.id)) {
						// Event content is a stringified JSON, so parse it
						this.subscribers.get(message.id)!(JSON.parse(message.event));
					}
					break;
				case "subscribe_success":
					if (this.subscriptionPromises.get(message.id)) {
						this.subscriptionPromises.get(message.id)!.resolve();
						this.subscriptionPromises.delete(message.id);
					}
					break;
				case "subscribe_error":
					if (this.subscriptionPromises.get(message.id)) {
						this.subscriptionPromises
							.get(message.id)!
							.reject(
								new Error(message.errors[0]?.message || "Subscription error"),
							);
						this.subscriptionPromises.delete(message.id);
					}
					break;
			}
		});
	}

	/**
	 * Subscribes to a specified channel.
	 * @param channel The channel path to subscribe to.
	 * @param authorization The authorization object for the subscription.
	 * @param callback The callback function to invoke when data is received for this subscription.
	 * @returns The ID of the created subscription.
	 */
	public subscribe(
		channel: string,
		authorization: object,
		callback: SubscriberCallback,
	): string {
		// Changed return type to string
		const id = uuidv4();
		const subscribeMessage = buildSubscribeMessage(id, channel, authorization);
		this.connectionManager.send(JSON.stringify(subscribeMessage));
		this.subscribers.set(id, callback);

		// Store the resolve/reject functions for this subscription ID
		let resolvePromise: () => void;
		let rejectPromise: (error: Error) => void;
		const promise = new Promise<void>((resolve, reject) => {
			resolvePromise = resolve;
			rejectPromise = reject;
		});
		this.subscriptionPromises.set(id, {
			resolve: resolvePromise!,
			reject: rejectPromise!,
			promise,
		});

		return id; // Return the id immediately
	}

	/**
	 * Unsubscribes from a previously subscribed channel.
	 * @param subscriptionId The ID of the subscription to unsubscribe from.
	 */
	public unsubscribe(subscriptionId: string): void {
		const unsubscribeMessage = {
			type: "unsubscribe",
			id: subscriptionId,
		};
		this.connectionManager.send(JSON.stringify(unsubscribeMessage));
		this.subscribers.delete(subscriptionId);
	}
}
