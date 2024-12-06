# Writing Dockerfiles

## ADD

```ts
dockerfile.ADD("package.json", ".");

dockerfile.ADD("/some/dir ect/package.json", ".");

dockerfile.ADD(["package-lock.json", "package.json"], "./")
```

## ARG

```ts
dockerfile.ARG("user");

// With default vaule
dockerfile.ARG("user", { default: "someuser" });
```

## CMD

```ts
// With executable and parameters
dockerfile.CMD("node", ["myfile.js", "upcase"]);

// Only parameters
dockerfile.CMD(["myfile.js", "upcase"]);
```

## COPY

```ts
// Single file
dockerfile.COPY("package.json", ".");

// Multiple files
dockerfile.COPY(["package-lock.json", "package.json"], "./");

// With options
dockerfile.COPY("package.json", ".", {
  from: "base",
  chown: "myuser:mygroup",
  chmod: "644",
  link: true,
})
```

## ENTRYPOINT

```ts
// With executable
dockerfile.ENTRYPOINT("node");

// With executable and parameters
dockerfile.ENTRYPOINT("node", ["myfile.js", "upcase"]);
```

## ENV

```ts
dockerfile.ENV("NODE_ENV", "production");

// With ARG interpolation
dockerfile.ENV("NODE_ENV", "${node_env}");
```

## EXPOSE

```ts
dockerfile.EXPOSE(80);
dockerfile.EXPOSE("1000-10010");
dockerfile.EXPOSE({ port: 4321, protocol: "udp" });

// With argument interpolation
dockerfile.EXPOSE("${server_port}");
dockerfile.EXPOSE({ port: "${server_port}", protocol: "udp" });
```

## FROM

```ts
dockerfile.FROM("node:20-slim");

// With AS
dockerfile.FROM("node:20-slim", { as: "base", platform: "linux/arm64" });

// With platform flag
dockerfile.FROM("node:20-slim", { platform: "linux/arm64" });
```

## HEALTHCHECK

```ts
dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1");
dockerfile.HEALTHCHECK("NONE");

// With options
dockerfile.HEALTHCHECK("curl -f http://localhost/ || exit 1", {
  interval: "40s",
  timeout: "1s",
  startPeriod: "10s",
  startInterval: "1s",
  retries: 5,
})
```

## LABEL

```ts
dockerfile.LABEL({ key: "com.example.vendor", value: "ACME Incorporated"});

dockerfile.LABEL([
  { key: "com.example.vendor", value: "ACME Incorporated"},
  { key: "version", value: "1.0"}
]);
```

## ONBUILD

Use the `onBuild` option on a instruction:

```ts
dockerfile.ADD(".", "/app/src", { onBuild: true });

dockerfile.RUN("apt-get install curl", {
  onBuild: true,
});
```

## RUN

```ts
dockerfile.RUN("apt-get update");

dockerfile.RUN(["apt-get update", "apt-get install -y curl"]);

// With bind mount
.RUN("tsc .", {
  mount: {
    type: "bind",
    target: "/root/.build",
    source: "./tmp/build",
    from: "/home/ci",
    readwrite: true,
  },
})
```

See [RUN](./../reference/api/classes/Dockerfile.md#run) for more options.

## SHELL

```ts
dockerfile.SHELL("cmd", ["/S", "/C"]);
```

## STOPSIGNAL

```ts
dockerfile.STOPSIGNAL("SIGABRT");

dockerfile.STOPSIGNAL(9);
```

## USER

```ts
// Name
dockerfile.USER({ name: "node" });

// Name and group
dockerfile.USER({ name: "node", group: "docker" });

// UID
dockerfile.USER({ uid: 501 });

// UID and GID
dockerfile.USER({ uid: 501, gid: 401 });
```

## VOLUME

```ts
// Single
dockerfile.VOLUME("/data");

// Multiple
dockerfile.VOLUME(["/data", "/var/log"])
```

## WORKDIR

```ts
dockerfile.WORKDIR("/app")
```

## Banner

```ts
dockerfile.banner("App image");
```

```text
# ---------
# App image
# ---------
```

## Comment

```ts
dockerfile.banner("This is a comment");
dockerfile.WORKDIR("/app")

```

```text
# This is a comment
WORKDIR /app
```

## Group

Group instructions by disabling the blank line between them.

```ts
dockerfile.WORKDIR("/app")
dockerfile.ENV("NODE_ENV", "production")
dockerfile.group(() => {
  dockerfile.EXPOSE(1025)
  dockerfile.EXPOSE(8025)
}));
```

```text
WORKDIR /app

ENV NODE_ENV="production"

EXPOSE 1025
EXPOSE 8025
```

## Blank line

```ts
dockerfile.blank();
```

```text

```
