# AGENTS.md — `@codexporer.io/app-analytics`

## Package Overview
Unified multi-provider analytics facade dispatching events simultaneously to Firebase Analytics, AWS Amplify, and Facebook Analytics.

## Architecture & Peer Dependencies
- **Firebase Analytics (`src/firebase`)**:
  - Pure JavaScript implementation of Google Analytics 4 (GA4) Measurement Protocol v2 via HTTPS `fetch()`.
  - **CRITICAL**: Does **NOT** depend on `@react-native-firebase/analytics` or any native Google Analytics library. Never attempt to install or configure native Firebase dependencies for this adapter.
  - Requires `measurementId` (format `G-XXXXXXXXXX`) in `config.config` and `clientId` (UUID v4) in `config.options`.
- **AWS Amplify (`src/amplify`)**:
  - Uses `aws-amplify/analytics` and `aws-amplify/analytics/kinesis-firehose`.
  - Peer dependency: `aws-amplify: >=6.0.0` (optional; only needed if `amplify` adapter is initialized).
  - Requires `firehoseStreamName` in the `amplify` config object.
- **Facebook Analytics (`src/facebook`)**:
  - Uses `react-native-fbsdk-next`.
  - Peer dependency: `react-native-fbsdk-next: >=13.4.1` (optional; dynamically loaded via `require('react-native-fbsdk-next')` only if `facebook` config is passed to `initialize`).
- **Lodash (`lodash`)**:
  - Required peer dependency (`*`). Used across all adapters for parameter and attribute transformations.

## Key Exports
- `initialize(params?: AnalyticsInitializeParams)`: Configures active provider adapters.
- `sendEvent({ name, attributes })`: Dispatches an analytics event (`SendEventParams`).
- `sendScreenEvent({ screenName, attributes })`: Dispatches a screen view event (`SendScreenEventParams`).
- `setUserId(userId)`: Sets global user ID across active adapters.
- `setUserProperties(properties)`: Sets global user segmentation properties (`EventAttributes`).
- **Types**: `AnalyticsInitializeParams`, `FirebaseInitParams`, `SendEventParams`, `SendScreenEventParams`, `EventAttributes`, `EventAttributeValue`.

## Instructions for AI Agents
- **Object Parameter Calling Convention**: Always pass parameters as a single object:
  - `sendEvent({ name: 'event_name', attributes: { key: 'value' } })` — DO NOT call `sendEvent('name', attributes)`.
  - `sendScreenEvent({ screenName: 'ScreenName', attributes: { source: 'tab' } })` — DO NOT call `sendScreenEvent('ScreenName')` or `{ name: 'ScreenName' }`.
- **Event Naming**: Use `snake_case` for all custom event names (`video_rendered`, `crop_applied`).
  - Event names must be 1–40 alphanumeric characters or underscores, starting with an alphabetic character, and must NOT start with `firebase_`, `google_`, or `ga_`.
- **User Properties**: Must be 1–24 alphanumeric characters or underscores, starting with an alphabetic character, with string values up to 36 characters.
- **No Sensitive Data**: Never log passwords, tokens, full local file paths containing user names, or sensitive identifiers.
- **Provider Initialization**: Call `initialize()` once at root app mount; unconfigured providers are safely skipped.
- **React Native Hook**: When integrating into a React Native / Expo application, check if a wrapper hook such as `useAppAnalytics` or `useSendActiveScreenEvent` is already available (e.g., in `src/hooks/useAppAnalytics.js`), which automatically enriches telemetry with device and app metadata.
