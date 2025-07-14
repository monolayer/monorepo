/**
 * @module AppSyncEventsClient
 * The main entry point for the AWS AppSync Events WebSocket client library.
 */

import { v4 as uuidv4 } from "uuid";
import type { Channel } from "../channel.js";
import type { RouteParams, ValidateUniqueParams } from "../types.js";
import { ConnectionManager } from "./connectionManager.js";
import { EventEmitter } from "./eventEmitter.js";
import { buildPublishMessage } from "./messageBuilder.js";
import { SubscriptionManager } from "./subscriptionManager.js";
import { AppSyncWebSocketMessage } from "./types.js";

/**
 * Configuration options for the BroadcastClient.
 */
export interface BroadcastClientConfig {
	url: string;
	authorization: object;
}

/**
 * A client for interacting with the AWS AppSync Events WebSocket API.
 * This client handles connection management, authentication, and provides
 * an interface for subscribing to and publishing events.
 */

export class BroadcastClient<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	C extends Record<string, { channel: Channel<any> }>,
> {
	private declare _channels: C;

	private connectionManager: ConnectionManager;
	private subscriptionManager: SubscriptionManager;
	eventEmitter: EventEmitter;
	private readonly url: string;
	private readonly host: string;
	connected: boolean;
	/**
	 * Creates an instance of AppSyncEventsClient.
	 * @param url The WebSocket URL for the AWS AppSync Events API.
	 * @param authorization The authorization object required for the WebSocket connection.
	 */
	constructor(opts: { url: string; host: string }) {
		this.url = opts.url;
		this.host = opts.host;
		this.connectionManager = new ConnectionManager(this.url);
		this.eventEmitter = new EventEmitter();
		this.subscriptionManager = new SubscriptionManager(
			this.connectionManager,
			this.eventEmitter,
		);
		this.connected = false;
		// Register a handler for incoming messages from the ConnectionManager
		this.connectionManager.onMessage((message: AppSyncWebSocketMessage) => {
			switch (message.type) {
				case "subscribe_error":
				case "publish_error":
				case "broadcast_error":
					this.eventEmitter.emit("error", message);
					break;
				default:
					this.eventEmitter.emit("message", message);
					break;
			}
		});

		// Register a handler for connection close events from the ConnectionManager
		this.connectionManager.onClose(() => {
			this.connected = false;
			this.eventEmitter.emit("disconnected");
		});
	}

	/**
	 * Establishes a connection to the AWS AppSync Events WebSocket API.
	 * @returns A Promise that resolves when the connection is successfully established.
	 */
	public async connect(): Promise<void> {
		await this.connectionManager.connect();
		this.connected = true;
		this.eventEmitter.emit("connected");
	}

	/**
	 * Disconnects from the AWS AppSync Events WebSocket API.
	 */
	public disconnect(): void {
		this.connected = false;
		this.connectionManager.disconnect();
	}

	/**
	 * Subscribes to a specified channel to receive real-time events.
	 * @param channel The channel path to subscribe to.
	 * @param authorization The authorization object for the subscription.
	 * @returns The ID of the created subscription.
	 */
	public subscribe(
		channel: string,
		authorization: object,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callback: (payload: any) => void,
	): string {
		return this.subscriptionManager.subscribe(channel, authorization, callback); // Add a dummy callback
	}

	subscribeTo<T extends keyof C & string>(
		channelName: ValidateUniqueParams<T>,
		params: RouteParams<T>,
		callback: (
			data: C[T] extends { channel: Channel<infer P> } ? P : never,
		) => void,
	) {
		const path = (channelName as string).replace(
			/\[([^\]]+)\]/g,
			(match, key) => {
				return (params as Record<string, string>)[key] || match; // If key is not found, keep the placeholder
			},
		);
		// Construct the final URL
		return this.subscriptionManager.subscribe(
			`default${path}`,
			{
				clientId: this.connectionManager.clientId,
				host: this.host,
				Authorization: "--",
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			callback as (payload: any) => void,
		); // Add a dummy callback

		return;
	}

	/**
	 * Unsubscribes from a previously subscribed channel.
	 * @param subscriptionId The ID of the subscription to unsubscribe from.
	 */
	public unsubscribe(subscriptionId: string): void {
		this.subscriptionManager.unsubscribe(subscriptionId);
	}

	/**
	 * Publishes events to a specified channel.
	 * @param channel The channel path to publish to.
	 * @param events An array of stringified JSON events to be published.
	 * @param authorization The authorization object for the publish operation.
	 */
	public publish(
		channel: string,
		events: string[],
		authorization: object,
	): void {
		const id = uuidv4();
		const publishMessage = buildPublishMessage(
			id,
			channel,
			events,
			authorization,
		);
		this.connectionManager.send(JSON.stringify(publishMessage));
	}

	/**
	 * Registers a listener for a specific event emitted by the client.
	 * @param eventName The name of the event to listen for (e.g., 'message', 'connected', 'disconnected').
	 * @param listener The callback function to be invoked when the event is emitted.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public on(eventName: string, listener: (...args: any[]) => void): void {
		this.eventEmitter.on(eventName, listener);
	}

	/**
	 * Removes a registered listener for a specific event.
	 * @param eventName The name of the event to remove the listener from.
	 * @param listener The callback function to be removed.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public off(eventName: string, listener: (...args: any[]) => void): void {
		this.eventEmitter.off(eventName, listener);
	}
}
