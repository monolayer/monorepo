# Research: CLI Version Check

## Decision: Use a standard HTTPS request to the npm registry

To get the latest version of the `@monolayer/sdk` package, we will make a standard HTTPS GET request to the npm registry API.

**Endpoint**: `https://registry.npmjs.org/@monolayer/sdk/latest`

This endpoint returns a JSON object with metadata about the latest version of the package, including the version number.

## Rationale

-   **Simplicity**: This approach is simple and does not require any special client libraries. A standard HTTP client is sufficient.
-   **Reliability**: The npm registry API is highly available and reliable.
-   **Performance**: A single GET request is lightweight and will have minimal impact on performance.

## Alternatives Considered

-   **Using a dedicated npm client library**: While libraries like `npm-registry-client` exist, they are overkill for this simple use case and would add unnecessary dependencies to the project.
