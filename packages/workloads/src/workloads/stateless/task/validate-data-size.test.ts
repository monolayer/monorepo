import { assert, test } from "vitest";
import { validateJsonStringified } from "~workloads/workloads/stateless/task/validate-data-size.js";

test("passes on JSON stringified data less than 256000 bytes", () => {
	const data = generateString(255997); // Stringified data will be 259999 bytes

	assert.doesNotThrow(() => validateJsonStringified(data));
});

test("passes on JSON stringified data larger equal to 256000 bytes", () => {
	const data = generateString(255998); // Stringified data will be 256000 bytes

	assert.doesNotThrow(() => validateJsonStringified(data));
});

test("throw on JSON stringified data larger than 256000 bytes", () => {
	const data = generateString(255999); // Stringified data will be 256001 bytes

	assert.throws(() => validateJsonStringified(data));
});

test("passes on JSON stringified less than to 100000 bytes", () => {
	const data = generateString(99997); // Stringified data will be 99999 bytes

	assert.doesNotThrow(() => validateJsonStringified(data, 100000));
});

test("passes on JSON stringified equal to 100000 bytes", () => {
	const data = generateString(99998); // Stringified data will be 100000 bytes

	assert.doesNotThrow(() => validateJsonStringified(data, 100000));
});

test("throw on JSON stringified data larger than 100000 bytes", () => {
	const data = generateString(99999); // Stringified data will be 100001 bytes

	assert.throws(() => validateJsonStringified(data, 100000));
});

const characters =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateString(length: number) {
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}
