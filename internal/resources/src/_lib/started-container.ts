import {
	AbstractStartedContainer,
	type StartedTestContainer,
} from "testcontainers";

export abstract class StartedServerContainer<
	K extends AbstractStartedContainer,
> extends AbstractStartedContainer {
	constructor(
		startedTestContainer: StartedTestContainer,
		callback?: (startedContainer: K) => void,
	) {
		super(startedTestContainer);
		if (callback) {
			callback(this as unknown as K);
		}
	}

	abstract get serverPort(): number;
	abstract get connectionURL(): string;
}

export abstract class StartedServerContainerWithWebUI<
	K extends AbstractStartedContainer,
> extends StartedServerContainer<K> {
	abstract get webUIPort(): number;
	abstract get webURL(): string;
}
