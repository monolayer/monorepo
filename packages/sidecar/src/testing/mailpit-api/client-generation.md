# Client generation

1. Generate client.

    ```bash
    npx @hey-api/openapi-ts -i packages/sidecar/src/testing/swagger.json -o packages/sidecar/src/testing/mailpit-client -c @hey-api/client-fetch
    ```

2. Add ".js" to imports.

3. Add `/* eslint-disable max-lines */` to files.
