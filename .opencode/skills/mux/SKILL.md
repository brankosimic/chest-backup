---
name: mux
description: Mobile UX Review (mux) — review mobile screens against native UI/UX best practices. Trigger: "mux", "mobile review", "mobile ux", "check mobile".
---

# Mobile UX Review (mux)

Review a React Native/Expo mobile screen implementation against mobile native UI/UX best practices.

## Steps

### 1. Read the screen file

Load the screen component (`.tsx`) and its styles (`.ts` under `src/styles/`).

### 2. Check against this checklist

#### Touch targets
- All interactive elements should have at least 44×44pt touch area (Apple HIG)
- Header buttons (`backButton`, `headerHistoryButton`) must have sufficient padding
- `paddingVertical: spacing.sm` (8pt) alone is too small — use `spacing.md` (12pt) minimum
- Bottom-anchored buttons should have `paddingVertical: spacing.md` or more

#### Screen structure
- Wrapped in `SafeAreaView`
- Uses `FlatList` or `ScrollView` for scrollable content
- Loading state: `ActivityIndicator` with proper sizing
- Error state: error message + retry button
- Empty state: centered message
- Keyboard handling: `keyboardType` set correctly for inputs (e.g., `"number-pad"` for OTP)

#### Navigation
- Stack screens need a back button in the header
- Back button should be `TouchableOpacity` with `navigation.goBack()`
- Tab screens should match existing tab patterns

#### Platform conventions
- Bottom sheets: slide-up animation, drag handle visual, close button, backdrop dismiss
- Modals: fade/ slide animation, backdrop dismiss, proper keyboard type
- Pull-to-refresh on data lists (`RefreshControl`)
- Bottom-anchored primary action buttons (not floating in scroll)

#### Consistency
- Uses shared `colors`, `spacing`, `typography`, `borderRadius` from `styles/tokens`
- Screen-specific styles in `src/styles/{screenName}.ts`, imported as `{ screenName }`
- Text truncation with `numberOfLines={1}` on long labels
- i18n: all user-facing strings use `t()` — never hardcoded
- Matches patterns from existing screens (DashboardScreen, InvoicesScreen, InvoiceDetailScreen)

#### State management
- `useState` / `useCallback` / `useEffect` patterns matching existing screens
- Loading, error, empty states for every data-fetching path
- Cleanup on unmount: socket disconnect, timers, subscriptions
- Avoid duplicate UI elements (e.g., two cancel buttons in one view)

#### Accessibility
- Interactive elements should have `accessibilityLabel` or `aria-label` where the visual label is unclear
- Color is not the only indicator of state (e.g., status badges use both color and text, not color alone)
- Touch targets meet minimum size regardless of device scale
- Text contrast is sufficient against its background

#### Visual feedback
- `TouchableOpacity` with `activeOpacity` (typically `0.7` or `0.8`) on all interactive elements
- Disabled buttons are visually dimmed (`opacity: 0.5`), not hidden or removed
- Loading state disables the triggering button to prevent double-submit
- Checkboxes and toggles show immediate visual feedback on press (no lag)

#### Platform patterns
- Destructive actions (cancel, delete) use red/destructive color, never primary blue
- iOS: bottom sheets slide up; Android: dialogs are more common
- Primary action button is on the right in confirm/alert rows (iOS convention)
- No platform-specific code that doesn't have a matching implementation for the other platform

#### Form & input UX
- `TextInput` uses appropriate `keyboardType` (`"number-pad"` for PIN/OTP, `"email-address"` for email, `"default"` for text)
- `autoFocus` on the primary input when a modal opens
- `returnKeyType` is set (`"done"`, `"next"`, `"go"`, etc.) for proper keyboard flow
- `onSubmitEditing` handles the submit action for the last field
- `maxLength` set on constrained inputs (OTP codes, phone numbers)

#### Empty states
- Not just text — includes an icon or illustration when appropriate
- Includes a clear message explaining why the list is empty
- Includes a call-to-action button when recovery is possible (e.g., "Add first invoice")
- Empty state is centered, not stuck at the top

#### Error messages
- Written in plain language, not technical error codes or raw API messages
- Includes a clear recovery action ("Retry" button or navigation suggestion)
- Positioned inline near the affected content, not just as a generic toast

#### Performance
- `FlatList` uses stable `keyExtractor` (never array index as key)
- `renderItem` callbacks are wrapped in `useCallback` to avoid re-renders
- Expensive computations are memoized with `useMemo`
- Avoid anonymous functions in render where possible

#### Font & text
- Text respects system font size where appropriate (avoid hardcoding `fontSize` on body text if the design system allows scaling)
- Long text is truncated with `numberOfLines` and `ellipsizeMode` instead of letting it overflow
- No text clipping: containers have enough padding or height for their content

### 4. Fix all violations

Fix each issue found. Re-run `npx tsc --noEmit` after each fix.

### 5. Report results

Present a markdown table with columns:
| Category | Status | Notes |
|----------|--------|-------|
| Touch targets | ✅ Pass / ❌ Fail / 🔧 Fixed | — |
| Screen structure | ... | ... |
| Navigation | ... | ... |
| Platform conventions | ... | ... |
| Consistency | ... | ... |
| State management | ... | ... |
| Accessibility | ... | ... |
| Visual feedback | ... | ... |
| Platform patterns | ... | ... |
| Form & input UX | ... | ... |
| Empty states | ... | ... |
| Error messages | ... | ... |
| Performance | ... | ... |
| Font & text | ... | ... |

## Rules

- Do NOT commit changes unless explicitly asked
- Do NOT modify files unrelated to the review
- Do NOT skip violations even if they seem minor
- Re-run type checks after every fix

## Context

- Project root: `/Users/bane/Desktop/code/racuni`
- Mobile root: `/Users/bane/Desktop/code/racuni/mobile/`
- This is a monorepo with `frontend/`, `mobile/`, `backend/`, and `packages/shared/`
