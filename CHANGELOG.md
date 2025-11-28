# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- System notifications when timer completes (via tauri-plugin-notification)
- Audio feedback on timer completion using Web Audio API
  - Double chime for work session completion
  - Softer single chime for break completion
- Notification permission handling on app startup
- Phase 2 tutorial documentation

### Fixed
- Duplicate tray icon appearing in menu bar (removed config-based tray, kept programmatic one)
