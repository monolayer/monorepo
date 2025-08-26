import http from "http";
import { Readable, Writable } from "stream";

class ReadableResponse extends Readable {
	constructor(options) {
		super(options);
	}
	_read() {}
}

export class AppResponse extends http.ServerResponse {
	connection = null;
	socket = null;
	strictContentLength = false;

	_responseStream;
	_readableResponse;

	constructor(req, responseStream) {
		super(req);
		this._responseStream = responseStream;
		this._headersEmitted = false;
		this.assignSocket(new Writable());
		this._readableResponse = new ReadableResponse();
		this._readableResponse.pipe(this._responseStream);
	}

	writeHead(statusCode, statusMessage, headers) {
		super.writeHead(statusCode, statusMessage, headers);
		// eslint-disable-next-line no-undef
		awslambda.HttpResponseStream.from(
			this._responseStream,
			this.awsMetadataPrelude(),
		);
	}

	write(chunk, encoding, callback) {
		const res = this._readableResponse.push(chunk, encoding);
		if (callback) callback();
		return res;
	}

	end(chunk, encoding) {
		if (chunk) this._readableResponse.push(chunk, encoding);
		this._readableResponse.push(null);
	}

	awsMetadataPrelude() {
		const awsMetadata = {
			statusCode: this.statusCode,
		};

		const cookies =
			this.getHeader("set-cookie") ?? this.getHeader("Set-Cookie");
		if (cookies) {
			awsMetadata.cookies = [cookies].flat();
		}
		const headersToFilterOut = ["set-cookie"];

		awsMetadata.headers = Object.fromEntries(
			Object.entries(this.getHeaders()).filter(
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				([key, _]) => !headersToFilterOut.includes(key.toLowerCase()),
			),
		);

		const link = awsMetadata.headers["link"];
		if (link && Array.isArray(link)) {
			awsMetadata.headers["link"] = link.join(", ");
		}

		const location = awsMetadata.headers["location"];
		if (location && Array.isArray(location)) {
			awsMetadata.headers["location"] = location[0];
		}

		if (
			awsMetadata.headers["content-type"] &&
			Array.isArray(awsMetadata.headers["content-type"])
		) {
			awsMetadata.headers["content-type"] = location[0];
		}

		if (
			awsMetadata.headers["Content-Type"] &&
			Array.isArray(awsMetadata.headers["Content-Type"])
		) {
			awsMetadata.headers["Content-Type"] = location[0];
		}
		return awsMetadata;
	}
}
