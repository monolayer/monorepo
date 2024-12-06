---
outline: [2,3,4]
---

# Quick start

## Installation

```bash
npm install @monolayer/dw
```

## Writing Dockerfiles

```ts
import { Dockerfile } from "@monolayer/dw";

const df = new Dockerfile();

df.banner("App image");

df.FROM("node:20-alpine", { as: "runner" })

df.comment(
  "Add libc6-compat package (required for use of process.dlopen)",
);
df.RUN("apk add --no-cache gcompat=1.1.0-r4");

df.WORKDIR("/app");

df.group(() => {
  df.COPY("index.js, "./")
  df.COPY("index.js.map, "./")
});

df.ENV("NODE_ENV", "production");

df.CMD(["index.js"]);

df.blank()

df.ENTRYPOINT("node");

df.save("./app.Dockerfile");
```
