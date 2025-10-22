# Data Model: CLI Version Check

## Entities

### CLIVersion

Represents the version information for the CLI.

**Fields**:

-   `currentVersion` (string): The currently installed version of the CLI.
-   `latestVersion` (string): The latest version of the CLI available on the npm registry.

**Validation Rules**:

-   Both `currentVersion` and `latestVersion` must be valid semantic version strings.
