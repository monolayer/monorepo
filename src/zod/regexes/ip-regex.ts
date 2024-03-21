// MIT License

// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const word = "[a-fA-F\\d:]";

type Options = {
	includeBoundaries?: boolean;
	exact?: boolean;
};

const boundry = (options?: Options) =>
	options && options.includeBoundaries
		? `(?:(?<=\\s|^)(?=${word})|(?<=${word})(?=\\s|$))`
		: "";

const ipv4 =
	"(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}";

const v6segment = "[a-fA-F\\d]{1,4}";

const ipv6 = `
(?:
(?:${v6segment}:){7}(?:${v6segment}|:)|                                    // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6segment}:){6}(?:${ipv4}|:${v6segment}|:)|                             // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6segment}:){5}(?::${ipv4}|(?::${v6segment}){1,2}|:)|                   // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6segment}:){4}(?:(?::${v6segment}){0,1}:${ipv4}|(?::${v6segment}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6segment}:){3}(?:(?::${v6segment}){0,2}:${ipv4}|(?::${v6segment}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6segment}:){2}(?:(?::${v6segment}){0,3}:${ipv4}|(?::${v6segment}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6segment}:){1}(?:(?::${v6segment}){0,4}:${ipv4}|(?::${v6segment}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::(?:(?::${v6segment}){0,5}:${ipv4}|(?::${v6segment}){1,7}|:))             // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(?:%[0-9a-zA-Z]{1,})?                                             // %eth0            %1
`
	.replace(/\s*\/\/.*$/gm, "")
	.replace(/\n/g, "")
	.trim();

// Pre-compile only the exact regexes because adding a global flag make regexes stateful
const ipv46Exact = new RegExp(`(?:^${ipv4}$)|(?:^${ipv6}$)`);
const ipv4exact = new RegExp(`^${ipv4}$`);
const ipv6exact = new RegExp(`^${ipv6}$`);

export const ipRegex = (options?: Options) =>
	options && options.exact
		? ipv46Exact
		: new RegExp(
				`(?:${boundry(options)}${ipv4}${boundry(options)})|(?:${boundry(options)}${ipv6}${boundry(options)})`,
				"g",
			);

ipRegex.v4 = (options?: Options) =>
	options && options.exact
		? ipv4exact
		: new RegExp(`${boundry(options)}${ipv4}${boundry(options)}`, "g");
ipRegex.v6 = (options?: Options) =>
	options && options.exact
		? ipv6exact
		: new RegExp(`${boundry(options)}${ipv6}${boundry(options)}`, "g");
