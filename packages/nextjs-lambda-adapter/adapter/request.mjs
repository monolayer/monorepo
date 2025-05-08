import http from "http";
import { format } from "url";

export function APIGatewayProxyEventV2ToAppRequest(event) {
	return new AppRequest({
		method: event.requestContext.http.method,
		headers: requestHeaders(event),
		url: format({
			pathname: event.rawPath,
			search: event.rawQueryString,
		}),
		remoteAddress: event.requestContext.http.sourceIp,
		body: requestBody(event),
	});
}

function requestHeaders(event) {
	return Object.keys(event.headers).reduce(
		(headers, key) => {
			headers[key.toLowerCase()] = event.headers[key];
			return headers;
		},
		Array.isArray(event.cookies) ? { cookie: event.cookies.join("; ") } : {},
	);
}

function requestBody(event) {
	const type = typeof event.body;
	if (Buffer.isBuffer(event.body)) {
		return event.body;
	} else if (type === "string") {
		return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
	} else if (type === "object") {
		return Buffer.from(JSON.stringify(event.body));
	} else {
		return Buffer.from("", "utf8");
	}
}

export class AppRequest extends http.IncomingMessage {
	constructor({ method, url, headers, body, remoteAddress }) {
		super({
			encrypted: true,
			readable: false,
			remoteAddress,
			address: () => ({ port: 443 }),
			end: Function.prototype,
			destroy: Function.prototype,
		});

		if (typeof headers["content-length"] === "undefined") {
			headers["content-length"] = Buffer.byteLength(body);
		}

		Object.assign(this, {
			ip: remoteAddress,
			complete: true,
			httpVersion: "1.1",
			httpVersionMajor: "1",
			httpVersionMinor: "1",
			method,
			headers,
			body,
			url,
			socket: null,
		});

		this._read = () => {
			this.push(body);
			this.push(null);
		};
	}
}
