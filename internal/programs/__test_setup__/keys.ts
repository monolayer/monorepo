export const keys = {
	DOWN: "\x1B\x5B\x42",
	UP: "\x1B\x5B\x41",
	ENTER: "\x0D",
	SPACE: "\x20",
	CONTROLC: "\x03",
};

export async function pressKey(key: keyof typeof keys) {
	process.stdin.push(keys[key]);
}
