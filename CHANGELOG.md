# Changelog

All notable changes to the Log to Table extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-22

### Added
- Added parser, file-reading, and extension activation tests.
- Added CI across the minimum and current VS Code versions.
- Added automated dependency updates, VSIX artifacts, and tagged GitHub releases.
- Added strict webview content security policy and responsive table styling.

### Fixed
- Fixed log file selection on Windows and encoded paths.
- Fixed large-file metadata after refresh.
- Fixed stale errors, pagination state, and out-of-order refresh responses.
- Fixed malformed webview HTML and disabled button bindings.
- Preserved blank lines in multiline log entries and UTF-8 boundaries in large-file tails.
- Added validation for custom regex safety and required named groups.

### Changed
- Updated TypeScript, ESLint, VS Code test tooling, Alpine CSP, and packaging dependencies.
- Made log file access asynchronous to avoid blocking the extension host.
- Reduced the packaged extension to runtime files only.
- Corrected repository and marketplace documentation links.

## [1.0.0] - 2026-02-01

### Fixed
- Fixed refresh action issues

### Changed
- Improved AlpineJS dependency management

## [0.2.3] - 2025-09-28

### Changed
- Performance improvements for small log file loading

## [0.2.2] - 2025-09-27

### Fixed
- Bug fix for small log file failures

## [0.2.1] - 2025-09-26

### Added
- 5MB file size limit for log files

## [0.2.0] - 2025-09-25

### Added
- Custom regex patterns support for non-Laravel log formats
- Refresh button for log files
- Severity dropdown filter
- Menu integration for viewing logs
- Expandable log messages with word wrapping options

### Changed
- Major rebranding to "Log to Table"

## [0.1.1] - 2025-09-20

### Fixed
- README documentation updates

## [0.1.0] - 2025-09-19

### Added
- Second command for finding and opening log files
- Menu button for quick access
- Message expansion options for log entries
- Improved styling

## [0.0.1] - 2025-09-15

### Added
- Initial release
- Laravel log table viewing functionality
- Basic filtering and pagination
