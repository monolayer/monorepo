"use client";
import {
	createContext,
	use,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { Channel } from "~workloads/workloads/stateless/broadcast/channel.js";
import { AppSyncEventsClient } from "./app-sync-client.js";

export type WebSocketsContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ws: AppSyncEventsClient<any>;
	connected: boolean;
} | null;

export const WebSocketsProvider = createContext<WebSocketsContext>(null);

export interface WebSocketsContextProviderProps {
	urlAndHost: { url: string; host: string };
	children: ReactNode;
}

export function WebSocketsContextProvider({
	urlAndHost,
	children,
}: WebSocketsContextProviderProps) {
	const [ws] = useState(
		useMemo(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return new AppSyncEventsClient<any>(urlAndHost);
		}, [urlAndHost]),
	);
	const [connected, setConnected] = useState(false);
	useEffect(() => {
		async function connect() {
			await ws.connect();
			ws.connected = true;
			setConnected(true);
		}
		connect().catch(console.error);
	}, [ws]);

	return (
		<WebSocketsProvider.Provider value={{ ws, connected }}>
			{children}
		</WebSocketsProvider.Provider>
	);
}

export function useWebSocket<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, { channel: Channel<any> }>,
>() {
	const context = use(WebSocketsProvider);
	if (!context) {
		throw new Error(
			"useWebSockets must be used within a <WebSocketsProvider />",
		);
	}
	return context.ws as AppSyncEventsClient<T>;
}
