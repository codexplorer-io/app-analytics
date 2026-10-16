# `@codexporer.io/app-analytics`

Unified cross-platform analytics client supporting Firebase Analytics, AWS Amplify, and Facebook Analytics in React Native and Expo applications. Broadcasts events simultaneously across all initialized providers through a single consistent API.

---

## Architecture & Peer Dependencies

The package uses a modular provider model with minimal overhead:

| Provider | Mechanism | Peer Dependency | Notes |
| :--- | :--- | :--- | :--- |
| **Firebase Analytics** | Pure-JS Google Analytics 4 Measurement Protocol v2 via HTTPS `fetch()` | **None** | **No native dependencies!** Does *not* require `@react-native-firebase/analytics`. Works seamlessly in Expo Go, bare React Native, and web. |
| **AWS Amplify** | Amazon Kinesis Data Firehose via `aws-amplify` | `aws-amplify: >=6.0.0` | Optional. Required only if the `amplify` adapter is initialized. |
| **Facebook Analytics** | Facebook App Events SDK via `react-native-fbsdk-next` | `react-native-fbsdk-next: >=13.4.1` | Optional. Dynamically loaded at runtime only when the `facebook` adapter is initialized. |
| **Utility** | Data manipulation & transformations | `lodash: *` | Required peer dependency across adapters. |

### Installation

```bash
yarn add @codexporer.io/app-analytics lodash
```

Install optional provider SDKs only if you intend to initialize them:

```bash
# If using AWS Amplify:
yarn add aws-amplify

# If using Facebook App Events:
yarn add react-native-fbsdk-next
```

---

## Quick Start

### 1. Initialize During App Bootstrap

Call `initialize` once at application startup (e.g. in your root layout or index). Unconfigured adapters are safely skipped:

```tsx
import { initialize } from '@codexporer.io/app-analytics';

initialize({
  // Firebase Analytics (GA4 Measurement Protocol v2 over HTTPS)
  firebase: {
    config: {
      measurementId: 'G-XXXXXXXXXX' // Required: GA4 Measurement ID
    },
    options: {
      clientId: '550e8400-e29b-41d4-a716-446655440000', // Required: UUID v4 client / installation ID
      sessionId: '1712910291',                           // Optional: session identifier
      appName: 'Captifly',                               // Optional
      appVersion: '1.3.0',                               // Optional
      debug: __DEV__                                     // Optional: console logs & debug flag
    }
  },

  // AWS Amplify (Kinesis Firehose)
  amplify: {
    firehoseStreamName: 'my-analytics-stream'            // Required if amplify is initialized
  },

  // Facebook App Events
  facebook: {
    // Pass truthy object to activate require('react-native-fbsdk-next')
  }
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

// Set authenticated user context across all active adapters
setUserId('usr_102938');
setUserProperties({ plan: 'pro', locale: 'en-US' });

// Track custom user events
sendEvent({
  name: 'clip_recorded',
  attributes: {
    duration_seconds: 15,
    camera_facing: 'back',
    resolution: '1080p'
  }
});

// Track screen transitions (auto-deduplicated if called repeatedly for the same screen)
sendScreenEvent({
  screenName: 'RecordingScreen',
  attributes: {
    entry_point: 'home_cta'
  }
});
```

---

## Adapter Behavior & Data Transformation

When an event or screen view is dispatched, each adapter formats attributes according to its platform conventions:

### Firebase (GA4 Measurement Protocol)
- Event name must be 1–40 alphanumeric characters or underscores, starting with a letter, and not prefixed with `firebase_`, `google_`, or `ga_`.
- String attributes are sent as `ep.<key>`, numeric values as `epn.<key>`.
- Arrays are serialized as `[val1;val2]`, booleans as `"true"`/`"false"`.
- User properties are prefixed with `up.<key>` or `upn.<key>`.
- Current screen is sent as `ep.screen_name`.
- Events are queued and debounced (`maxCacheTime`, default: 5000ms, or 10ms in debug mode) before posting to `https://www.google-analytics.com/g/collect`.

### AWS Amplify
- Dispatches records to Amazon Kinesis Firehose using the configured `firehoseStreamName`.
- Attributes are mapped as `attr_<key>`.
- User properties are mapped as `usrprop_<key>` and user ID as `usrprop_user_id`.
- Current screen is mapped as `screen_name`.

### Facebook App Events
- Dispatches via `react-native-fbsdk-next`'s `AppEventsLogger.logEvent`.
- Attributes are mapped as `attr_<key>`.
- User properties are mapped as `usrprop_<key>` and user ID as `usrprop_user_id`.
- Current screen is mapped as `screen_name`.

---

## API Reference

### `initialize(params?: AnalyticsInitializeParams): void`
Configures and activates the specified analytics providers.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `firebase` | `FirebaseInitParams` | `{ config: { measurementId }, options: { clientId, sessionId?, appName?, appVersion?, debug?, maxCacheTime? } }` |
| `amplify` | `EventAttributes` | Must include `firehoseStreamName` to enable Kinesis Firehose delivery |
| `facebook` | `EventAttributes` | Truthy configuration object to activate `react-native-fbsdk-next` |

### `sendEvent(params: SendEventParams): void`
Dispatches a custom event to all initialized providers.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Unique event name (recommended format: `snake_case`) |
| `attributes` | `EventAttributes` (`Record<string, EventAttributeValue>`) | No | Key-value dictionary of event metadata |

### `sendScreenEvent(params: SendScreenEventParams): void`
Dispatches a screen view event to all initialized providers. Automatically deduplicates sequential calls for the identical screen name.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `screenName` | `string` | Yes | Name of the active screen or view |
| `attributes` | `EventAttributes` | No | Additional metadata associated with the screen transition |

### `setUserId(userId: string): void`
Associates future events with a specific user identifier across all active adapters.

### `setUserProperties(properties: EventAttributes): void`
Sets persistent user segmentation attributes across all active adapters.

### Exported Types
```typescript
export type EventAttributeValue = string | number | boolean | null | undefined;
export type EventAttributes = Record<string, EventAttributeValue>;

export interface FirebaseInitParams {
    config?: EventAttributes; // Requires measurementId: string ('G-XXXXXXXXXX')
    options?: EventAttributes; // Requires clientId: string (UUID v4)
}

export interface AnalyticsInitializeParams {
    firebase?: FirebaseInitParams;
    amplify?: EventAttributes; // Requires firehoseStreamName: string
    facebook?: EventAttributes;
}

export interface SendEventParams {
    name: string;
    attributes?: EventAttributes;
}

export interface SendScreenEventParams {
    screenName: string;
    attributes?: EventAttributes;
}
```

---

## Best Practices & Guidelines

1. **Single Object Parameter**: `sendEvent` and `sendScreenEvent` take a single options object (`{ name, attributes }` and `{ screenName, attributes }`), **never** positional arguments.
2. **Standardize Naming**: Use lowercase `snake_case` for event names (e.g., `clip_saved`, `filter_applied`).
3. **No Sensitive Data**: Never pass passwords, auth tokens, credit cards, or personally identifiable financial data in `attributes`.
4. **Idempotent Initialization**: Call `initialize()` once during application startup before any events are fired.
5. **No Native Firebase Setup Needed**: Do not install `@react-native-firebase/analytics` for this package; Firebase uses pure-JS HTTPS requests.

---

## License

MIT
