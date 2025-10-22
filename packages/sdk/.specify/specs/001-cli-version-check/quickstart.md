# Quickstart: CLI Version Check

This document describes how to test the CLI version check feature.

## Prerequisites

-   A development environment with the Monolayer SDK project checked out.
-   `pnpm` installed.

## Steps

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Simulate an outdated version**:
    -   Open `package.json` in the `packages/sdk` directory.
    -   Change the `version` field to an older version (e.g., `0.0.1`).

3.  **Run a CLI command**:
    -   Run any `monolayer` command (e.g., `monolayer status`).
    -   You should see a notification message in the console indicating that a newer version is available.

4.  **Simulate the latest version**:
    -   Revert the change to the `version` field in `package.json`.
    -   Run any `monolayer` command again.
    -   You should not see a notification message.
