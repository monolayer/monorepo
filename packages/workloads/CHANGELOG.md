<!-- markdownlint-disable MD001 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2024-12-24

### Added

- Introspect installed package version

## [1.4.0] - 2024-12-24

### Changed

- Optional project root in project introspection.

## [1.3.1] - 2024-12-24

### Added

- Cron and task dockerfile to manifest.

### Changed

- Generate Node.js 22 based Dockerfiles.

### Fixed

- Add version to required properties in manifest schema.
- Fix required property name in manifest schema.

## [1.3.0-beta-1] - 2024-12-24

### Changed

- Export project introspection methods.

## [1.2.0-beta-1] - 2024-12-22

### Added

- Introspection module.

## [1.1.2-beta-1] - 2024-12-05

### Changed

- DockerfileGen is DockerfileWriter

### Fixed

- Missing mailers in build output
- Redundant file copy in task Dockerfile.

## [1.1.1-beta-1] - 2024-12-03

### Fixed

- Build output JSON schema: properties should be optional.

### Added

- Cron workload.
- Task workload.

## [1.1.0-beta-1] - 2024-12-03

### Added

- Cron workload.
- Task workload.

## [1.0.0-beta-2] - 2024-11-25

### Changed

- Homepage in package.json.

## [1.0.0-beta-1] - 2024-11-25

### Added

- Initial beta release.
