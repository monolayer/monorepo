/// <reference lib="dom" />

import { v4 as uuidv4 } from "uuid";
import { getAuthProtocol } from "./authenticator.js";
import { parseMessage } from "./parser.js";
import type { AppSyncWebSocketMessage, ConnectionAckMessage } from "./types.js";

/**
 * @module ConnectionManager
 * Manages the WebSocket connection lifecycle with the AWS AppSync Events API.
 */

// import WebSocket, { CloseEvent, ErrorEvent, MessageEvent } from "ws";

type MessageHandler = (message: AppSyncWebSocketMessage) => void;
type CloseHandler = (event: CloseEvent) => void;

/**
 * Manages the WebSocket connection to the AWS AppSync Events API.
 * Handles connection establishment, sending initial messages, and receiving acknowledgments.
 */
export class ConnectionManager {
	public ws: WebSocket | null = null;
	private readonly url: string;
	private connectionTimeoutMs: number = 0;
	private keepAliveTimer: ReturnType<typeof setTimeout> | null = null;
	private connectPromiseResolve: (() => void) | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private connectPromiseReject: ((reason?: any) => void) | null = null;
	private messageHandler: MessageHandler | null = null;
	private closeHandler: CloseHandler | null = null;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 10;
	private reconnectDelay: number = 1000; // 1 second
	private maxReconnectDelay: number = 30000; // 30 seconds
	private _clientId?: string;
	/**
	 * Creates an instance of ConnectionManager.
	 * @param url The WebSocket URL for the AWS AppSync Events API.
	 */
	constructor(url: string) {
		this.url = url;
	}

	public clientId() {
		return this._clientId;
	}
	/**
	 * Establishes a WebSocket connection to the AWS AppSync Events API.
	 * @returns A Promise that resolves when the connection is successfully established and acknowledged.
	 */
	public connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.connectPromiseResolve = resolve;
			this.connectPromiseReject = reject;

			this._clientId = uuidv4();
			this.ws = new WebSocket(this.url, [
				"aws-appsync-event-ws",
				getAuthProtocol({
					clientId: this._clientId,
					host: "",
					Authorization: "",
				}),
			]);

			this.ws.onopen = () => {
				this.reconnectAttempts = 0;
				this.ws?.send(JSON.stringify({ type: "connection_init" }));
			};

			this.ws.onmessage = (event: MessageEvent) => {
				const message = parseMessage(
					event.data as string,
				) as AppSyncWebSocketMessage;
				switch (message.type) {
					case "connection_ack":
						this.connectionTimeoutMs = (
							message as ConnectionAckMessage
						).connectionTimeoutMs;
						this.startKeepAliveTimer();
						this.connectPromiseResolve?.();
						break;
					case "ka":
						this.resetKeepAliveTimer();
						break;
					default:
						// Pass other messages to the registered handler
						if (this.messageHandler) {
							this.messageHandler(message);
						}
						break;
				}
			};

			this.ws.onerror = (error: Event) => {
				this.clearKeepAliveTimer();
				this.connectPromiseReject?.(error);
			};

			this.ws.onclose = (event: CloseEvent) => {
				this.clearKeepAliveTimer();
				if (!event.wasClean) {
					// Attempt to reconnect if the closure was not clean
					this.reconnect();
				} else {
					this.connectPromiseReject?.(
						new Error(
							`WebSocket closed unexpectedly: ${event.code} - ${event.reason}`,
						),
					);
				}
				// Call the registered close handler
				if (this.closeHandler) {
					this.closeHandler(event);
				}
			};
		});
	}

	/**
	 * Registers a handler for incoming WebSocket messages.
	 * @param handler The function to call when a new message is received.
	 */
	public onMessage(handler: MessageHandler): void {
		this.messageHandler = handler;
	}

	/**
	 * Registers a handler for WebSocket close events.
	 * @param handler The function to call when the WebSocket connection is closed.
	 */
	public onClose(handler: CloseHandler): void {
		this.closeHandler = handler;
	}

	/**
	 * Sends a message over the WebSocket connection.
	 * @param message The message string to send.
	 */
	public send(message: string): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(message);
		} else {
			console.warn("WebSocket is not open. Message not sent.", message);
		}
	}

	/**
	 * Closes the WebSocket connection gracefully.
	 * This method clears any active keep-alive timers and closes the underlying WebSocket.
	 */
	public disconnect(): void {
		this.clearKeepAliveTimer();
		if (this.ws) {
			this.ws.close();
			this.ws = null;
			this._clientId = "";
		}
	}

	private reconnect(): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			const delay = Math.min(
				this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
				this.maxReconnectDelay,
			);
			console.log(
				`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})...`,
			);
			setTimeout(() => {
				// Re-call connect to attempt reconnection
				this.connect();
			}, delay);
		} else {
			console.error(
				"Max reconnect attempts reached. Connection permanently lost.",
			);
			this.connectPromiseReject?.(new Error("Max reconnect attempts reached"));
		}
	}

	private startKeepAliveTimer(): void {
		this.clearKeepAliveTimer();
		this.keepAliveTimer = setTimeout(() => {
			// If timer expires, no keep-alive message received
			this.ws?.close();
			this.connectPromiseReject?.(
				new Error("WebSocket closed due to keep-alive timeout"),
			);
		}, this.connectionTimeoutMs);
	}

	private resetKeepAliveTimer(): void {
		this.startKeepAliveTimer(); // Simply restart the timer
	}

	private clearKeepAliveTimer(): void {
		if (this.keepAliveTimer) {
			clearTimeout(this.keepAliveTimer);
			this.keepAliveTimer = null;
		}
	}
}
