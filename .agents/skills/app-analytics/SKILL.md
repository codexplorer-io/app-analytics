---
name: app-analytics
description: Instructions and guidelines for using @codexporer.io/app-analytics (App Analytics) in React Native and Expo applications.
---

# `@codexporer.io/app-analytics` Skill

## Overview
`@codexporer.io/app-analytics` is a unified cross-platform analytics client supporting Firebase Analytics, AWS Amplify, and Facebook Analytics in React Native and Expo applications. It broadcasts events simultaneously across all initialized providers through a single consistent API.

---

## When to Use
- Logging user interactions, screen views, and conversion milestones.
- Setting up user session IDs or persistent user traits.
- Sending custom attributes alongside telemetry data.
- Creating unified analytics telemetry in Expo Go, bare React Native, and web apps.

---

## Architecture & Peer Dependencies

| Provider | Implementation | Peer Dependency | Notes |
| :--- | :--- | :--- | :--- |
| **Firebase** | Pure-JS GA4 Measurement Protocol v2 via HTTPS `fetch()` | **None** | **No native modules needed!** Does *not* require `@react-native-firebase/analytics`. Runs anywhere `fetch` is available. |
| **AWS Amplify** | Amazon Kinesis Data Firehose via `aws-amplify` | `aws-amplify: >=6.0.0` | Optional. Only needed when the `amplify` adapter is initialized. |
| **Facebook** | Facebook App Events SDK via `react-native-fbsdk-next` | `react-native-fbsdk-next: >=13.4.1` | Optional. Loaded dynamically at runtime only when the `facebook` adapter is initialized. |
| **Utility** | Transformation and iteration helpers | `lodash: *` | Required across adapters. |

---

## Installation & Setup

```bash
yarn add @codexporer.io/app-analytics lodash
```

Install optional provider SDKs only if you plan to initialize them:

```bash
# If using AWS Amplify:
yarn add aws-amplify

# If using Facebook App Events:
yarn add react-native-fbsdk-next
```

### Root Initialization
Call `initialize` once at application startup before dispatching any events. Unconfigured adapters are safely skipped:

```tsx
import { initialize } from '@codexporer.io/app-analytics';

initialize({
  // Firebase Analytics (pure JS GA4 Measurement Protocol v2 over HTTPS)
  firebase: {
    config: {
      measurementId: 'G-XXXXXXXXXX' // Required: GA4 Measurement ID
    },
    options: {
      clientId: '550e8400-e29b-41d4-a716-446655440000', // Required: UUID v4 client / installation ID
      sessionId: '1712910291',                           // Optional: session identifier
      appName: 'Captifly',                               // Optional
      appVersion: '1.3.0',                               // Optional
      debug: __DEV__                                     // Optional: console logging & debug flag
    }
  },

  // AWS Amplify (Amazon Kinesis Firehose)
  amplify: {
    firehoseStreamName: 'my-analytics-stream'            // Required if amplify is initialized
  },

  // Facebook App Events
  facebook: {
    // Pass truthy object to activate require('react-native-fbsdk-next')
  }
});
```

---

## Usage Examples

### Tracking Events & Screens

```tsx
import {
  sendEvent,
  sendScreenEvent,
  setUserId,
  setUserProperties
} from '@codexporer.io/app-analytics';

// Set authenticated user context across all active adapters
setUserId('usr_482910');
setUserProperties({ plan: 'premium', signupChannel: 'organic' });

// Track a custom action
sendEvent({
  name: 'export_video_started',
  attributes: {
    format: 'mp4',
    resolution: '1080p',
    clipCount: 4
  }
});

// Track screen transition (automatically deduplicated if called consecutively for the same screen)
sendScreenEvent({
  screenName: 'VideoCreatorScreen',
  attributes: {
    entry_point: 'gallery_action_sheet'
  }
});
```

### Using in React Native / Expo with Custom Hooks
In applications, wrap `@codexporer.io/app-analytics` in a domain hook (such as `useAppAnalytics`) to automatically attach device, app version, screen orientation, and session ID to every event:

```tsx
import { useSendActiveScreenEvent, useAppAnalytics } from '../hooks/useAppAnalytics';

// Automatically sends screen_view event when the screen gains focus:
useSendActiveScreenEvent({ screenName: 'Recording' });

// In event handlers:
const { sendEvent } = useAppAnalytics();
sendEvent({ name: 'clip_saved', attributes: { duration_seconds: 15 } });
```

---

## API Reference

### `initialize(params?: AnalyticsInitializeParams): void`
| Option | Type | Description |
| :--- | :--- | :--- |
| `firebase` | `FirebaseInitParams` | `{ config: { measurementId }, options: { clientId, sessionId?, appName?, appVersion?, debug?, maxCacheTime? } }` |
| `amplify` | `EventAttributes` | Must include `firehoseStreamName` to enable Kinesis Firehose delivery |
| `facebook` | `EventAttributes` | Truthy object to activate `react-native-fbsdk-next` |

### `sendEvent(params: SendEventParams): void`
| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Event name (snake_case, 1–40 alphanumeric or underscore characters) |
| `attributes` | `EventAttributes` | No | Custom event attributes dictionary |

### `sendScreenEvent(params: SendScreenEventParams): void`
| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `screenName` | `string` | Yes | Name of the visited screen (auto-deduplicated on consecutive calls) |
| `attributes` | `EventAttributes` | No | Screen context metadata |

### `setUserId(userId: string): void`
Sets current user ID across all active analytics providers (`uid` in Firebase, `usrprop_user_id` in Amplify & Facebook).

### `setUserProperties(properties: EventAttributes): void`
Sets persistent user attributes across all active analytics providers (`up.<key>` in Firebase, `usrprop_<key>` in Amplify & Facebook).

### Exported Types
- `EventAttributeValue`: `string | number | boolean | null | undefined`
- `EventAttributes`: `Record<string, EventAttributeValue>`
- `FirebaseInitParams`: `{ config?: EventAttributes; options?: EventAttributes }`
- `AnalyticsInitializeParams`: `{ firebase?: FirebaseInitParams; amplify?: EventAttributes; facebook?: EventAttributes }`
- `SendEventParams`: `{ name: string; attributes?: EventAttributes }`
- `SendScreenEventParams`: `{ screenName: string; attributes?: EventAttributes }`

---

## Critical Rules & Guidelines

1. **Object Parameter Convention**: `sendEvent` and `sendScreenEvent` accept a single object with `{ name, attributes }` and `{ screenName, attributes }`. Never call `sendEvent('name', attributes)`.
2. **Naming Convention**: Always use `snake_case` for event names (e.g., `filter_applied`, `preset_deleted`). Names must start with a letter and must NOT start with `firebase_`, `google_`, or `ga_`.
3. **No Native Firebase Dependency**: Do not install or import `@react-native-firebase/analytics` for this package. The Firebase adapter uses pure-JS HTTP requests via GA4 Measurement Protocol v2.
4. **Mandatory Firebase Config**: If initializing `firebase`, both `measurementId` (in `config`) and `clientId` (UUID v4 in `options`) are strictly required by the underlying client constructor.
5. **Mandatory Amplify Config**: If initializing `amplify`, `firehoseStreamName` is required in the configuration object.
6. **Privacy**: Never include passwords, authorization headers, credit card data, or sensitive personal data in attributes.
