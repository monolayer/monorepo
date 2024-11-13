<!-- markdownlint-disable MD001 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.1] - 2024-12-13

### Added

- Schema management without migrations.
- Data migrations decoupled from schema migrations.

### Changed

- Replaced @clack/prompts with ora and prompts.
- Reorganized CLI commands into `db`, `push`, `data`, and `seed`.

### Removed

- Schema migrations.

## [1.0.0-beta-4] - 2024-09-12

### Fixed

- Readme link.

## [1.0.0-beta-3] - 2024-09-12

### Changed

- Package name.

### Fixed

- Documentation links and Markdown formatting.

## [1.0.0-beta-2] - 2024-09-05

### Added

- Rollback action.

### Changed

- Append migrations rows to dump without `Writable`.

### Fixed

- Configuration path in program tests.

## [1.0.0-beta-1] - 2024-08-28

### Added

- Initial beta release.

[2.0.0-beta.1]: https://github.com/monolayer/monorepo/releases/tag/monolayer-pg-2.0.0-beta.1
