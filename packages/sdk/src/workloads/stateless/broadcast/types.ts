/* eslint-disable @typescript-eslint/no-explicit-any */
export type Channel<T> = {
	_data: T;
	subscribed?: (ctx: any) => void;
	unsubscribed?: (ctx: any) => void;
};

export type ChannelData<T extends Channel<any>> =
	T extends Channel<infer D> ? D : never;

export type Channels = Record<string, Channel<any>>;

export type ExtractRouteParamsTuple<
	T extends string,
	Acc extends string[] = [],
> = T extends `${string}[${infer Param}]${infer Rest}`
	? ExtractRouteParamsTuple<Rest, [...Acc, Param]>
	: Acc;

export type HasDuplicates<T extends readonly any[]> = T extends [
	infer F,
	...infer R,
]
	? F extends R[number]
		? true
		: HasDuplicates<R>
	: false;

export type ValidateUniqueParams<T extends string> =
	HasDuplicates<ExtractRouteParamsTuple<T>> extends true
		? ["❌ Duplicate route params not allowed in", T]
		: T;

export type TupleToParamObject<T extends readonly string[]> = {
	[K in T[number]]: string;
};

export type RouteParams<T extends string> = TupleToParamObject<
	ExtractRouteParamsTuple<T>
>;
