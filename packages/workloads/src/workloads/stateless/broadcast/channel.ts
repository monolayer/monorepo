export class Channel<D> {
	declare _data: D;
}

export function channel<D>() {
	return new Channel<D>();
}
