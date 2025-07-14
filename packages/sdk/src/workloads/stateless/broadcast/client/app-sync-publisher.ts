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
import { AppSyncWebSocketMessage } from "./types.js";

/**
 * Configuration options for the BroadcastPublisher.
 */
export interface BroadcastPublisherConfig {
	url: string;
	authorization: object;
}

/**
 * Publisher.
 * Handles connection management, authentication, and provides
 * an interface for publishing events.
 */

export class BroadcastPublisher<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	C extends Record<string, { channel: Channel<any> }>,
> {
	private declare _channels: C;

	private connectionManager: ConnectionManager;
	private eventEmitter: EventEmitter;

	constructor() {
		const urlFromEnv = process.env.ML_BROADCAST_URL ?? "ws://localhost:9311";
		this.connectionManager = new ConnectionManager(urlFromEnv);
		this.eventEmitter = new EventEmitter();

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
			this.eventEmitter.emit("disconnected");
		});
	}

	/**
	 * Establishes a connection to the AWS AppSync Events WebSocket API.
	 * @returns A Promise that resolves when the connection is successfully established.
	 */
	public async connect(): Promise<void> {
		await this.connectionManager.connect();
		this.eventEmitter.emit("connected");
	}

	/**
	 * Disconnects from the AWS AppSync Events WebSocket API.
	 */
	public disconnect(): void {
		this.connectionManager.disconnect();
	}

	async publishTo<T extends keyof C & string>(
		channelName: ValidateUniqueParams<T>,
		params: RouteParams<T>,
		data: C[T] extends { channel: Channel<infer P> } ? P[] : never,
	) {
		try {
			const path = (channelName as string).replace(
				/\[([^\]]+)\]/g,
				(match, key) => {
					return (params as Record<string, string>)[key] || match; // If key is not found, keep the placeholder
				},
			);

			await this.connect();
			for (const payload of data) {
				const events = JSON.stringify(payload);
				const publishMessage = buildPublishMessage(
					uuidv4(),
					`default${path}`,
					[events],
					{
						clientId: this.connectionManager.clientId,
						host: process.env.ML_BROADCAST_HOST ?? "localhost",
						Authorization: "--",
					},
				);
				this.connectionManager.send(JSON.stringify(publishMessage));
			}
			this.disconnect();
		} catch (e) {
			console.error(e);
			return false;
		}
		return true;
	}
}
