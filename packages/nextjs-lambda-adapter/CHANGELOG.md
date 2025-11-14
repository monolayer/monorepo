<!-- markdownlint-disable MD001 MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.10] - 2025-11-14

### Fixed

- Revive buffers in cached data.

## [4.0.9] - 2025-10-18

### Fixed

- Empty responses with callbackWaitsForEmptyEventLoop to false.

## [4.0.8] - 2025-10-18

### Fixed

- Empty responses.

## [4.0.7] - 2025-08-26

### Fixed

- Undefined variable when processing headers.

## [4.0.6] - 2025-08-26

### Fixed

- Headers on empty responses.
- Handle Content type and location headers arrays.

## [4.0.5] - 2025-06-04

### Fixed

- ImageOptimizationCache cacheDir location.

## [4.0.4] - 2025-06-03

### Fixed

- Stale S3 cache keys.

## [4.0.3-beta-1] - 2025-06-02

### Fixed

- Link headers.

## [4.0.2-beta-1] - 2025-05-26

### Fixed

- Loading packages that keep the event loop open.

## [4.0.1-beta.5] - 2025-05-08

### Fixed

- next/image handling.

## [4.0.2] - 2025-04-13

### Fixed

- Parse

## [4.0.1-beta.1] - 2025-04-13

### Fixed

- Dockerfile generation.

## [4.0.0-beta.1] - 2025-04-13

### Changed

- Dockerfile with Node.js 22.x.

## [3.0.0-beta.1] - 2025-04-13

### Changed

- Environment variable names.

## [2.0.0-beta.1] - 2025-04-13

### Changed

- Adapter code destination folder.

### Added

- Output sample Dockerfile.

## [1.0.0-beta.2] - 2025-03-31

### Fixed

- Missing return value in `AppResponse.write`.

## [1.0.0-beta.1] - 2025-03-31

### Added

- Initial beta release.
