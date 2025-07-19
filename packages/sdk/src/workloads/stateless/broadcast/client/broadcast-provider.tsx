"use client";
import {
	createContext,
	use,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { ChannelData } from "~workloads/workloads/stateless/broadcast/channel-data.js";
import { BroadcastClient } from "./app-sync-client.js";

export type BroadcastContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ws: BroadcastClient<any>;
	connected: boolean;
} | null;

export const BroadcastProvider = createContext<BroadcastContext>(null);

export interface BroadcastContextProviderProps {
	urlAndHost: { url: string; host: string };
	children: ReactNode;
}

export function BroadcastContextProvider({
	urlAndHost,
	children,
}: BroadcastContextProviderProps) {
	const [ws] = useState(
		useMemo(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return new BroadcastClient<any>(urlAndHost);
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
		return () => ws.disconnect();
	}, [ws]);

	return (
		<BroadcastProvider.Provider value={{ ws, connected }}>
			{children}
		</BroadcastProvider.Provider>
	);
}

export function useWebSocket<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, ChannelData<any>>,
>() {
	const context = use(BroadcastProvider);
	if (!context) {
		throw new Error(
			"useWebSockets must be used within a <BroadcastProvider />",
		);
	}
	return context.ws as BroadcastClient<T>;
}
