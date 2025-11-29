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
- **Glass Terminal design**: Modern UI with frosted glass, terminal colors, monospace font
  - Circular progress ring visualization showing countdown
  - Pulse glow animation on running timer
  - Cyan/green color scheme with subtle gradients
  - Enhanced button micro-interactions with ripple effects
- Window dragging functionality (drag from anywhere on background)
- Debug logging for session save operations

### Fixed
- Timer running at wrong speed when window hidden (browser throttling)
  - Now uses timestamp-based calculation instead of setInterval counting
- Removed unused Rust import warning
- **Critical**: Session data not being saved (function signature mismatch)
- **Critical**: Stats displaying incorrect data (property naming mismatch between interface and DB)
- **Critical**: SQL operations blocked by missing Tauri permissions (added sql:allow-execute, sql:allow-select)
- **Critical**: Window dragging blocked by missing permission (added core:window:allow-start-dragging)
- Auto-start only working after breaks, not after work sessions
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
- Window size increased to 380x280 (from 300x200) for better visual balance
- Window made resizable for flexibility
- All interactive elements excluded from drag region using -webkit-app-region
