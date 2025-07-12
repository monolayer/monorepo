import { useEffect, useReducer, useState } from "react";
import type { Channel } from "~workloads/workloads/stateless/broadcast/channel.js";
import { useWebSocket } from "~workloads/workloads/stateless/broadcast/client/websockets-provider.js";
import type { RouteParams } from "~workloads/workloads/stateless/broadcast/types.js";

export function client<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	C extends Record<string, { channel: Channel<any> }>,
>() {
	const useSubscription = <D extends keyof C & string>(
		channel: D,
		params: RouteParams<D>,
		initial: typeof channel extends string
			? C[typeof channel] extends { channel: Channel<infer P> }
				? P
				: never
			: never,
	) => {
		type StateType = typeof channel extends string
			? C[typeof channel] extends { channel: Channel<infer P> }
				? P
				: never
			: never;

		const [data, setData] = useState<StateType>(initial);
		const [subscribe, setSubscribed] = useState(false);
		const client = useWebSocket<C>();

		useEffect(() => {
			if (client.connected && !subscribe) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				client.subscribeTo(channel as any, params, (payload) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					setData(payload as any);
				});
				setSubscribed(true);
			}
		}, [client, channel, params, subscribe]);

		return data;
	};
	const useSubscriptionReducer = <D extends keyof C & string, S>(
		channel: D,
		params: RouteParams<D>,
		reducer: (
			prevState: S,
			...args: typeof channel extends string
				? C[typeof channel] extends { channel: Channel<infer P> }
					? [P]
					: never
				: never
		) => S,
		initialState: S,
	) => {
		const [subscribe, setSubscribed] = useState(false);
		const [state, dispatch] = useReducer(reducer, initialState);
		const ws = useWebSocket<C>();
		useEffect(() => {
			if (ws.connected && !subscribe) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				ws.subscribeTo(channel as any, params, (payload) => {
					//@ts-expect-error payload should match dispatch type
					dispatch(payload);
				});
				setSubscribed(true);
			}
		}, [ws, channel, params, subscribe]);

		return state;
	};
	return { useSubscriptionReducer, useSubscription };
}
