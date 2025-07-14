/**
 * @module types
 * Defines TypeScript interfaces for the AWS AppSync Events WebSocket protocol messages.
 */

/**
 * Base interface for all AppSync WebSocket messages.
 */
export interface AppSyncMessage {
	type: string;
}

/**
 * Interface for the 'connection_ack' message.
 */
export interface ConnectionAckMessage extends AppSyncMessage {
	type: "connection_ack";
	connectionTimeoutMs: number;
}

/**
 * Interface for the 'ka' (keep-alive) message.
 */
export interface KaMessage extends AppSyncMessage {
	type: "ka";
}

/**
 * Interface for 'subscribe_success' message.
 */
export interface SubscribeSuccessMessage extends AppSyncMessage {
	type: "subscribe_success";
	id: string;
}

/**
 * Interface for 'subscribe_error' message.
 */
export interface SubscribeErrorMessage extends AppSyncMessage {
	type: "subscribe_error";
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	errors: any[]; // Define a more specific error interface if needed
}

/**
 * Interface for 'data' message.
 */
export interface DataMessage extends AppSyncMessage {
	type: "data";
	id: string;
	event: string; // Event content is a stringified JSON
}

/**
 * Interface for 'broadcast_error' message.
 */
export interface BroadcastErrorMessage extends AppSyncMessage {
	type: "broadcast_error";
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	errors: any[]; // Define a more specific error interface if needed
}

/**
 * Interface for 'publish_success' message.
 */
export interface PublishSuccessMessage extends AppSyncMessage {
	type: "publish_success";
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	successful: any[]; // Define a more specific success interface if needed
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	failed: any[]; // Define a more specific failed interface if needed
}

/**
 * Interface for 'publish_error' message.
 */
export interface PublishErrorMessage extends AppSyncMessage {
	type: "publish_error";
	id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	errors: any[]; // Define a more specific error interface if needed
}

export type AppSyncWebSocketMessage =
	| ConnectionAckMessage
	| KaMessage
	| SubscribeSuccessMessage
	| SubscribeErrorMessage
	| DataMessage
	| BroadcastErrorMessage
	| PublishSuccessMessage
	| PublishErrorMessage;
