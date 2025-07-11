export { AppSyncEventsPublisher } from "~workloads/workloads/stateless/broadcast/client/app-sync-publisher.js";

export { client } from "~workloads/workloads/stateless/broadcast/client/client.js";
export {
	WebSocketsContextProvider,
	useWebSocket,
} from "~workloads/workloads/stateless/broadcast/client/websockets-provider.js";

export function broadcastURL() {
	return process.env.ML_BROADCAST_URL ?? "ws://localhost:9311";
}
