import { assert, describe, expect, test } from "vitest";
import { computeBackoff } from "~workloads/workloads/stateless/task/backoffs.js";

describe("compute backoff without options", () => {
	test("equals to 0", () => {
		expect(computeBackoff(1)).toBe(0);
		expect(computeBackoff(2)).toBe(0);
		expect(computeBackoff(3)).toBe(0);
		expect(computeBackoff(4)).toBe(0);
	});
});

describe("compute constant backoff", () => {
	test("equals to delay", () => {
		expect(computeBackoff(1, { type: "constant", delay: 100 })).toBe(100);
		expect(computeBackoff(2, { type: "constant", delay: 100 })).toBe(100);
		expect(computeBackoff(3, { type: "constant", delay: 100 })).toBe(100);
		expect(computeBackoff(4, { type: "constant", delay: 100 })).toBe(100);
	});
});

describe("compute exponential backoff", () => {
	test("increases exponentially with each retry", () => {
		expect(computeBackoff(1, { type: "exponential", delay: 100 })).toBe(200);
		expect(computeBackoff(2, { type: "exponential", delay: 100 })).toBe(400);
		expect(computeBackoff(3, { type: "exponential", delay: 100 })).toBe(800);
		expect(computeBackoff(4, { type: "exponential", delay: 100 })).toBe(1600);
	});

	test("returns 0 when delay is 0", () => {
		expect(computeBackoff(0, { type: "exponential", delay: 0 })).toBe(0);
		expect(computeBackoff(1, { type: "exponential", delay: 0 })).toBe(0);
		expect(computeBackoff(10, { type: "exponential", delay: 0 })).toBe(0);
	});

	test("returns delay when retry number is 0", () => {
		expect(computeBackoff(0, { type: "exponential", delay: 100 })).toBe(100);
		expect(computeBackoff(0, { type: "exponential", delay: 50 })).toBe(50);
	});

	test("rounds the result to the nearest integer", () => {
		expect(computeBackoff(3, { type: "exponential", delay: 2.5 })).toBe(20);
		expect(computeBackoff(2, { type: "exponential", delay: 1.33 })).toBe(5);
	});

	test("throws on negative retry", () => {
		assert.throws(() =>
			computeBackoff(-1, { type: "exponential", delay: 100 }),
		);
		assert.throws(() =>
			computeBackoff(-20, { type: "exponential", delay: 100 }),
		);
	});

	test("throws on negative delay", () => {
		assert.throws(() =>
			computeBackoff(10, { type: "exponential", delay: -100 }),
		);
		assert.throws(() =>
			computeBackoff(20, { type: "exponential", delay: -400 }),
		);
	});
});
