# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Custom durations**: Settings panel to customize work/break times (1-60 min)
- Settings persist across app restarts via tauri-plugin-store
- "Reset to Defaults" option in settings
- SQLite database setup for session history (tauri-plugin-sql)
- Database wrapper utilities (`src/lib/db.ts`)
- Auto-start work session after break ends
- Louder work completion sound (50% increase)

### Fixed
- Timer running at wrong speed when window hidden (browser throttling)
  - Now uses timestamp-based calculation instead of setInterval counting
- Removed unused Rust import warning
