# AGENTS.md — `@codexporer.io/app-analytics`

## Package Overview
Unified multi-provider analytics facade dispatching events simultaneously to Firebase Analytics, AWS Amplify, and Facebook Analytics.

## Key Exports
- `initialize(params?: AnalyticsInitializeParams)`: Configures active provider adapters.
- `sendEvent({ name, attributes })`: Dispatches an analytics event (`SendEventParams`).
- `sendScreenEvent({ screenName, attributes })`: Dispatches a screen view event (`SendScreenEventParams`).
- `setUserId(userId)`: Sets global user ID across adapters.
- `setUserProperties(properties)`: Sets global user segmentation properties (`EventAttributes`).
- **Types**: `AnalyticsInitializeParams`, `FirebaseInitParams`, `SendEventParams`, `SendScreenEventParams`, `EventAttributes`, `EventAttributeValue`.

## Instructions for AI Agents
- **Object Parameter Calling Convention**: Always pass parameters as a single object:
  - `sendEvent({ name: 'event_name', attributes: { key: 'value' } })` — DO NOT call `sendEvent('name', attributes)`.
  - `sendScreenEvent({ screenName: 'ScreenName', attributes: { source: 'tab' } })` — DO NOT call `sendScreenEvent('ScreenName')` or `{ name: 'ScreenName' }`.
- **Event Naming**: Use snake_case for all custom event names (`video_rendered`, `crop_applied`).
- **No Sensitive Data**: Never log passwords, tokens, full image file paths containing local user names, or sensitive identifiers.
- **Provider Readiness**: Call `initialize()` once at root app mount; unconfigured providers are safely skipped.
