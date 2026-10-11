# `@codexporer.io/app-analytics`

Unified cross-platform analytics client supporting Firebase Analytics, AWS Amplify, and Facebook Analytics in React Native and Expo applications.

## Installation & Peer Dependencies

```bash
yarn add @codexporer.io/app-analytics
```

Optional peer dependencies depending on active adapters:
- `@react-native-firebase/analytics` (if `firebase` adapter is initialized)
- `aws-amplify` (if `amplify` adapter is initialized)
- `react-native-fbsdk-next` (if `facebook` adapter is initialized)

## Quick Start

### 1. Initialize During App Bootstrap

Call `initialize` once at application startup (e.g. in your root layout or index):

```tsx
import { initialize } from '@codexporer.io/app-analytics';

initialize({
  firebase: {
    config: { persistence: true }
  },
  facebook: {}
});
```

### 2. Track Events and Screen Views

```tsx
import {
  sendEvent,
  sendScreenEvent,
  setUserId,
  setUserProperties
} from '@codexporer.io/app-analytics';

// Set authenticated user context
setUserId('usr_102938');
setUserProperties({ plan: 'pro', locale: 'en-US' });

// Track a custom event
sendEvent({
  name: 'photo_saved',
  attributes: {
    format: 'jpeg',
    resolution: '4k',
    filterApplied: true
  }
});

// Track a screen view
sendScreenEvent({
  screenName: 'EditorScreen',
  attributes: {
    source: 'gallery'
  }
});
```

## API Reference

### `initialize(params?: AnalyticsInitializeParams): void`
Configures and activates the specified analytics providers.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `firebase` | `FirebaseInitParams` (`{ config?: EventAttributes, options?: EventAttributes }`) | Configuration options for `@react-native-firebase/analytics` |
| `amplify` | `EventAttributes` | Configuration options for AWS Amplify analytics |
| `facebook` | `EventAttributes` | Configuration options for Facebook App Events |

### `sendEvent(params: SendEventParams): void`
Dispatches a custom event to all initialized providers.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Unique event name (recommended format: `snake_case`) |
| `attributes` | `EventAttributes` (`Record<string, EventAttributeValue>`) | No | Key-value dictionary of event metadata |

### `sendScreenEvent(params: SendScreenEventParams): void`
Dispatches a screen view event to all initialized providers.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `screenName` | `string` | Yes | Name of the active screen or view |
| `attributes` | `EventAttributes` (`Record<string, EventAttributeValue>`) | No | Additional metadata associated with the screen transition |

### `setUserId(userId: string): void`
Associates future events with a specific user identifier.

### `setUserProperties(properties: EventAttributes): void`
Sets persistent user attributes (`EventAttributes`) across sessions.

### Exported Types
- `EventAttributeValue`: `string | number | boolean | null | undefined`
- `EventAttributes`: `Record<string, EventAttributeValue>`
- `FirebaseInitParams`: `{ config?: EventAttributes; options?: EventAttributes }`
- `AnalyticsInitializeParams`: `{ firebase?: FirebaseInitParams; amplify?: EventAttributes; facebook?: EventAttributes }`
- `SendEventParams`: `{ name: string; attributes?: EventAttributes }`
- `SendScreenEventParams`: `{ screenName: string; attributes?: EventAttributes }`

## Best Practices & Guidelines

1. **Single Object Parameter**: Note that `sendEvent` and `sendScreenEvent` take a single options object (`{ name, attributes }` and `{ screenName, attributes }`), NOT separate positional parameters.
2. **Standardize Naming**: Use lowercase snake_case for event names (e.g., `project_created`, `filter_applied`).
3. **No Sensitive Data**: Never pass passwords, auth tokens, or personally identifiable financial data in `attributes`.
4. **Idempotent Initialization**: Call `initialize` once during app bootstrap before any events are fired.

## License

MIT
