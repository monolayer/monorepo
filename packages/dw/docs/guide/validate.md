
# Validating a Dockerfile

Use the [validate](./../reference/api/functions/validate.md) function to validate your Dockerfiles.

THis function will throw an error if the Dockerfile is not valid.

```ts
import { Dockerfile } from "@monolayer/dw";

const dfo = new Dockerfile();
dfo.FROM("node:20-alpine")
// Valid
dfo.validate()

const dft = new Dockerfile();
// Throws
dft.validate()

