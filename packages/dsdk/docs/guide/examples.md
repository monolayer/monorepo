---
outline: [2,3,4]
---

# Examples

## Image list

```ts
import { imageList } from "@monolayer/dsdk/v1.47";

await imageList({});

// OR

imageList({}, (err, images) => {
  console.log(images.map((image) => image.Size)));
});
```

## Building an image

```ts

import { readFileSync } from "node:fs";
import { imageBuild } from "@monolayer/dsdk/v1.47";

await imageBuild({
  query: {
    dockerfile: "Dockerfile",
    t: "app:latest",
  },
  body: readFileSync("/path/to/tar/app.tar.gz"),
});
```

## Get container logs

```ts
import { containerLogs } from "@monolayer/dsdk/v1.47";

containerLogs(
  {
    path: { id: "61b910ced2be" },
    query: {
      follow: true,
      stderr: true,
      stdout: true,
    },
  },
  (error, stdout, stderr) => {
    if (stdout) {
      process.stdout.write(stdout.toString());
    }
    if (stderr) {
      process.stdout.write(stderr.toString());
    }
  },
);
```

## Create a volume

```ts
import { volumeCreate } from "@monolayer/dsdk/v1.47";

await volumeCreate({ body: { Name: name } });
```
