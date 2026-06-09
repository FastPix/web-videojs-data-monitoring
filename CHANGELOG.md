# Changelog

All notable changes to this project will be documented in this file.

## [1.0.6]

### Changed

- Applied code quality fixes for improved maintainability and reliability:
  - Replaced `window` references with `globalThis.window` for safer global access.
  - Used `Number.parseInt` instead of the global `parseInt`.
  - Hoisted nested helper functions (`determinePreloadType`, `defaultOnReadyStateChange`, `dispatchRequestCompleted`, `dispatchRequestFailed`, `createCallback`, `createBeforeRequestCallback`, `handleOnRequestStateChange`) to reduce function nesting depth.
  - Replaced `Function` type usages with explicit function signatures.
  - Added explanatory comments to intentionally empty `catch` blocks.
  - Simplified conditional checks using optional chaining.
- Upgraded `@fastpix/video-data-core` (FastPix Data Core SDK) to `^1.0.8`.

## [1.0.5]

### Changed

- Upgraded `@fastpix/video-data-core` (FastPix Data Core SDK) to the latest version.

## [1.0.4]
### Changed
- Updated npm authentication from Classic token to Granular token for improved security and fine-grained permissions.

## [1.0.3]
- Updated `package.json` to include additional keywords related to video.js monitoring.

## [1.0.2]
- Upgraded the Video Data Core SDK to the latest version.
- Updated readme.md with a redirection link for supported dimension parameters.

## [1.0.1]
- Bug fix to prevent calls to getPlayerState and getPlayheadTimeInMs after the player has been destroyed.

## [1.0.0]

### Added
  - Integrated FastPix Data SDK with Video.js for performance tracking.
  - Enables detailed insights into user engagement, playback quality, and real-time streaming diagnostics.
  - Implemented robust error detection and reporting for Video.js-specific playback issues.
  - Supports customizable behavior, such as disabling cookies, respecting `Do Not Track` settings, and configuring advanced error handling.
  - Added custom metadata support to allow users to pass optional fields (`video_id`, `video_title`, `video_duration`, etc.) for enhanced tracking and reporting.
  - Introduced event tracking for `videoChange` to handle metadata updates during playback transitions within Video.js.
