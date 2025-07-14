#!/usr/bin/env node

/* eslint-disable max-lines */

import { WebSocket, WebSocketServer } from "ws";

const PORT = 9311;

interface AppSyncWebSocket<S> extends WebSocket {
	isAlive: boolean;
	connectionTimeoutMs: number;
	subscriptions: Map<string, string>;
	_authorizationToken: string;
	_session?: S;
}

const PING_INTERVAL = 1000 * 60; // 60 seconds

interface AppSyncTestServerOptions<S> {
	port: number;
	connectionTimeoutMs?: number;
	channelAuth?: (
		route: string,
		operation: "PUBLISH" | "SUBSCRIBE",
		session: S,
	) => Promise<boolean>;
	session?: (ctx: { cookies: Record<string, string> }) => Promise<S>;
}

class AppSyncTestServer<S> {
	private wss: WebSocketServer;
	private session: AppSyncTestServerOptions<S>["session"];
	private clients: Set<AppSyncWebSocket<S>>;
	private interval: NodeJS.Timeout | null = null;
	private connectionTimeoutMs: number;
	private channelAuth?: AppSyncTestServerOptions<S>["channelAuth"];
	constructor(opts: AppSyncTestServerOptions<S>) {
		this.wss = new WebSocketServer({ port: opts.port });
		this.clients = new Set<AppSyncWebSocket<S>>();
		this.connectionTimeoutMs = opts.connectionTimeoutMs ?? 300000;
		this.channelAuth = opts.channelAuth;
		this.session = opts.session;
		this.setupServer();
	}

	private setupServer() {
		this.wss.on("headers", (d) => {
			console.log(d);
		});
		this.wss.on("connection", async (ws: WebSocket, request) => {
			console.log(request.url);
			const client = ws as AppSyncWebSocket<S>;
			client.isAlive = true;
			client.subscriptions = new Map<string, string>();
			console.log("Client connected");

			const protocol = request.headers["sec-websocket-protocol"];
			const authProtocol = protocol?.split(",")[1]?.trim();
			const authProtocolName = protocol?.split(",")[0]?.trim();
			if (authProtocol && authProtocolName === "aws-appsync-event-ws") {
				try {
					const encodedHeader = authProtocol.substring("header-".length);
					const decodedHeader = Buffer.from(
						encodedHeader,
						"base64url",
					).toString("utf8");
					console.log("Decoded", decodedHeader);
					const auth = JSON.parse(decodedHeader);
					console.log("Authorization header:", auth);
					if (auth.Authorization === undefined) {
						console.error("Unauthorized");
						client.close(3000, "Unauthorized");
						return;
					}
					client._authorizationToken = auth.Authorization;
					if (this.session) {
						client._session = await this.session({ cookies: {} });
					}
					this.clients.add(client);
				} catch (e) {
					console.error("Failed to parse authorization header:", e);
					client.close(1008, "Invalid authorization header");
					return;
				}
			} else {
				console.error("Mising authorization:");
				client.close(1008, "Missing authorization");
			}

			client.on("pong", () => {
				client.isAlive = true;
			});

			client.on("message", async (message: string) => {
				console.log(`Received message: ${message}`);
				try {
					const parsedMessage = JSON.parse(message);
					console.log(parsedMessage);
					await this.handleMessage(client, parsedMessage);
				} catch (e) {
					console.error("Failed to parse message:", e);
					client.send(
						JSON.stringify({ type: "error", message: "Invalid JSON message" }),
					);
				}
			});

			client.on("close", () => {
				console.log("Client disconnected");
				this.clients.delete(client);
			});

			client.on("error", (error) => {
				console.error("WebSocket error:", error);
			});
		});

		this.interval = setInterval(() => {
			this.clients.forEach((client) => {
				if (client.isAlive === false) {
					console.log("Client not alive, terminating connection");
					return client.terminate();
				}
				client.isAlive = false;
				client.ping();
			});
		}, PING_INTERVAL);

		this.wss.on("close", () => {
			if (this.interval) {
				clearInterval(this.interval);
			}
		});

		console.log("AppSync Test Server started");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async handleMessage(client: AppSyncWebSocket<S>, message: any) {
		switch (message.type) {
			case "connection_init":
				client.connectionTimeoutMs = this.connectionTimeoutMs;
				client.send(
					JSON.stringify({
						type: "connection_ack",
						connectionTimeoutMs: client.connectionTimeoutMs,
					}),
				);
				break;
			case "subscribe":
				if (!message.id || !message.channel) {
					client.send(
						JSON.stringify({
							type: "subscribe_error",
							id: message.id,
							errors: [
								{
									errorType: "ValidationError",
									message: "Missing id or channel",
								},
							],
						}),
					);
					return;
				}
				if (client.subscriptions.has(message.id)) {
					client.send(
						JSON.stringify({
							type: "subscribe_error",
							id: message.id,
							errors: [
								{
									errorType: "DuplicateSubscriptionError",
									message: "Subscription ID already exists",
								},
							],
						}),
					);
					return;
				}
				if (this.channelAuth) {
					try {
						const isAuthorized = await this.channelAuth(
							message.channel,
							"SUBSCRIBE",
							client._session as S,
						);
						if (!isAuthorized) {
							console.error("Unauthorized");
							client.send(
								JSON.stringify({
									type: "subscribe_error",
									id: message.id,
									errors: [
										{
											errorType: "Unauthorized",
											message: "Unauthorized to subscribe",
										},
									],
								}),
							);
							return;
						}
					} catch {
						console.error("Internal Error");
						client.send(
							JSON.stringify({
								type: "internal_error",
								id: message.id,
								errors: [
									{
										errorType: "Internal Error",
									},
								],
							}),
						);
						return;
					}
				}
				client.subscriptions.set(message.id, message.channel);
				client.send(
					JSON.stringify({ type: "subscribe_success", id: message.id }),
				);
				console.log(
					`Client subscribed to channel: ${message.channel} with id: ${message.id}`,
				);
				break;
			case "unsubscribe":
				if (!message.id) {
					client.send(
						JSON.stringify({
							type: "unsubscribe_error",
							id: message.id,
							errors: [{ errorType: "ValidationError", message: "Missing id" }],
						}),
					);
					return;
				}
				if (client.subscriptions.delete(message.id)) {
					client.send(
						JSON.stringify({ type: "unsubscribe_success", id: message.id }),
					);
					console.log(`Client unsubscribed from id: ${message.id}`);
				} else {
					client.send(
						JSON.stringify({
							type: "unsubscribe_error",
							id: message.id,
							errors: [
								{
									errorType: "UnknownOperationError",
									message: `Unknown subscription id ${message.id}`,
								},
							],
						}),
					);
				}
				break;
			case "publish":
				if (!message.id || !message.channel || !message.events) {
					client.send(
						JSON.stringify({
							type: "publish_error",
							id: message.id,
							errors: [
								{
									errorType: "ValidationError",
									message: "Missing id, channel, or events",
								},
							],
						}),
					);
					return;
				}
				console.log(
					`Client publishing to channel: ${message.channel} with events:`,
					message.events,
				);
				if (this.channelAuth) {
					try {
						const isAuthorized = await this.channelAuth(
							message.channel,
							"PUBLISH",
							{} as S,
						);
						if (!isAuthorized) {
							console.error("Unauthorized");
							client.send(
								JSON.stringify({
									type: "subscribe_error",
									id: message.id,
									errors: [
										{
											errorType: "Unauthorized",
											message: "Unauthorized to subscribe",
										},
									],
								}),
							);
							return;
						}
					} catch {
						console.error("Internal Error");
						client.send(
							JSON.stringify({
								type: "internal_error",
								id: message.id,
								errors: [
									{
										errorType: "Internal Error",
									},
								],
							}),
						);
						return;
					}
				}
				this.broadcast(message.channel, message.events, message.id);
				console.log("message", message);
				client.send(
					JSON.stringify({
						type: "publish_success",
						id: message.id,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						successful: message.events.map((_: any, index: number) => ({
							identifier: `event-${index}`,
							index,
						})),
						failed: [],
					}),
				);
				break;
			default:
				client.send(
					JSON.stringify({ type: "error", message: "Unknown message type" }),
				);
				break;
		}
	}

	public broadcast(channel: string, events: string[], publishId?: string) {
		this.clients.forEach((client) => {
			client.subscriptions.forEach((subscribedChannel, subscriptionId) => {
				if (subscribedChannel === channel) {
					events.forEach((event) => {
						client.send(
							JSON.stringify({
								type: "data",
								id: subscriptionId,
								event: [event],
								publishId: publishId, // Include publishId for correlation if needed
							}),
						);
					});
				}
			});
		});
	}

	public close() {
		this.wss.close();
		if (this.interval) {
			clearInterval(this.interval);
		}
		console.log("AppSync Test Server closed");
	}

	public stopKeepAlive() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	public sendKeepAlive(client: AppSyncWebSocket<S>) {
		client.send(JSON.stringify({ type: "ka" }));
	}
}

async function main() {
	const routesPath = "/app/workloads/broadcast.js";
	const ru = await import(routesPath);
	const server = new AppSyncTestServer<{ userId: number }>({
		port: PORT,
		channelAuth: ru.authFn,
		session: ru.session,
	});
	process.on("SIGINT", () => {
		server.close();
		process.exit();
	});

	process.on("SIGTERM", () => {
		server.close();
		process.exit();
	});
}

main().catch(console.error);
