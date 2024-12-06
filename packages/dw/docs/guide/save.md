# Saving a Dockerfile

Write the contents of a Dockerfile to a file with the [save](./../reference/api/classes/Dockerfile.md#save) method.

```ts
import { Dockerfile } from "@monolayer/dw";

const df = new Dockerfile();

df.FROM("node:20-alpine")

// ....

df.save("./app.Dockerfile")
```
