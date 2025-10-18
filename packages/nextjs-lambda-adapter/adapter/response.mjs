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
	_responseWithContent;

	constructor(req, responseStream) {
		super(req);
		this._responseStream = responseStream;
		this._headersEmitted = false;
		this.assignSocket(new Writable());
		this._readableResponse = new ReadableResponse();
		this._readableResponse.pipe(this._responseStream);
		this._responseWithContent = false;
	}

	writeHead(statusCode, statusMessage, headers) {
		super.writeHead(statusCode, statusMessage, headers);
		HttpResponseStream.from(this._responseStream, this.awsMetadataPrelude());
	}

	write(chunk, encoding, callback) {
		if (!this._responseWithContent) {
			this._responseWithContent = true;
		}
		const res = this._readableResponse.push(chunk, encoding);
		if (callback) callback();
		return res;
	}

	end(chunk, encoding) {
		if (chunk) this._responseWithContent = true;
		this._readableResponse.push(chunk, encoding);
		if (!this._responseWithContent) {
			this._readableResponse.push("");
		}
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

		let contentType = awsMetadata.headers["content-type"];
		if (contentType && Array.isArray(contentType)) {
			awsMetadata.headers["content-type"] = contentType[0];
		}

		contentType = awsMetadata.headers["Content-Type"];
		if (contentType && Array.isArray(contentType)) {
			awsMetadata.headers["Content-Type"] = contentType[0];
		}
		return awsMetadata;
	}
}

/**
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * HttpResponseStream is NOT used by the runtime.
 * It is only exposed in the `awslambda` variable for customers to use.
 */
/*
 * Adapted: Flush prelude to underlyingStream immediately.
 */

const METADATA_PRELUDE_CONTENT_TYPE =
	"application/vnd.awslambda.http-integration-response";
const DELIMITER_LEN = 8;

class HttpResponseStream {
	static from(underlyingStream, prelude) {
		underlyingStream.setContentType(METADATA_PRELUDE_CONTENT_TYPE);

		// JSON.stringify is required. NULL byte is not allowed in metadataPrelude.
		const metadataPrelude = JSON.stringify(prelude);

		underlyingStream.write(metadataPrelude);

		// Write 8 null bytes after the JSON prelude.
		underlyingStream.write(new Uint8Array(DELIMITER_LEN));

		return underlyingStream;
	}
}
