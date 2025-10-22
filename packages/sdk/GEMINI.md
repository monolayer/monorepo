<!-- markdownlint-disable MD030 -->
<!-- markdownlint-disable MD040 -->

# Project Overview

This project is the Monolayer SDK, a TypeScript-based toolkit for building and deploying full-stack applications with zero infrastructure overhead. It is designed to be used with full-stack frameworks like Next.js. The SDK provides a way to define and manage "workloads," which can be stateful (like databases and object storage) or stateless (like cron jobs and tasks).

The core of the SDK is the concept of workloads, which are defined in the `src/workloads` directory. These workloads are managed by the CLI, which is defined in `src/bin/cli.ts`. The CLI provides commands for managing the lifecycle of workloads, including starting, stopping, and checking their status.

The SDK uses Docker to containerize workloads, with the base container logic defined in `src/containers/container.ts`. The `src/make` directory contains the logic for building the project and generating a `manifest.json` file that describes the workloads.

## Building and Running

The project is built using `npm run build`, which is a series of `tsc` and `tsup` commands. The build process creates a `dist` directory with the compiled JavaScript files.

The primary way to interact with the project is through the `monolayer` CLI, which is defined in `package.json` and implemented in `src/bin/cli.ts`. The CLI provides the following commands:

*   `monolayer start`: Starts the workloads.
*   `monolayer stop`: Stops the workloads.
*   `monolayer status`: Shows the status of the workloads.
*   `monolayer pull`: Pulls the Docker images for the workloads.
*   `monolayer build`: Builds the project and generates the `manifest.json` file.
*   `monolayer trigger`: Triggers a cron job.

## Development Conventions

The project uses TypeScript and is formatted with Prettier. It has a comprehensive test suite that is run with `vitest`. The tests are located in the `src` directory, with a `test` directory for setup and fixtures.

The project uses a conventional commit style for git commits. The commit message format is:

```
feat(scope): description
```

Where `scope` is the part of the project that is being changed, and `description` is a short description of the change.
