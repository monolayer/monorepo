import type { ReactNode } from "react";
import { BroadcastContextProvider } from "./broadcast-provider.js";

export function Broadcast({ children }: { children: ReactNode }) {
	return (
		<BroadcastContextProvider
			urlAndHost={{
				url: process.env.ML_BROADCAST_URL ?? "ws://localhost:9311",
				host: process.env.ML_BROADCAST_HOST ?? "localhost",
			}}
		>
			{children}
		</BroadcastContextProvider>
	);
}
