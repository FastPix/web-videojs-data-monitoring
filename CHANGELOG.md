# Changelog

All notable changes to this project will be documented in this file.

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
