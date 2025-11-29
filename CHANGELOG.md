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
- **Stats view**: Track and visualize completed sessions
  - Today's session count and focus time
  - This week's session count and focus time
  - Recent sessions list
- Session tracking on timer completion (saves to SQLite)
- Navigation with stats (📊) and settings (⚙) buttons

### Fixed
- Timer running at wrong speed when window hidden (browser throttling)
  - Now uses timestamp-based calculation instead of setInterval counting
- Removed unused Rust import warning
- **Critical**: Session data not being saved (function signature mismatch)
- **Critical**: Stats displaying incorrect data (property naming mismatch between interface and DB)
- Auto-start race condition after break completion (replaced setTimeout with useEffect)
- Settings max value inconsistency (longBreak now allows 60 min)
- Stats showing zero/empty on error instead of error message
- Missing error handling across all database operations
- Missing error handling in settings persistence
- Overly broad catch block in settings loader

### Changed
- Simplified Settings component (array map instead of repetitive inputs)
- Simplified Stats component (array map instead of duplicate sections)
- Simplified Timer mode switcher (array map instead of 3 buttons)
- Extracted date range query helper to reduce code duplication in db.ts
