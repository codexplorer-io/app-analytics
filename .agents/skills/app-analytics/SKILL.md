---
name: app-analytics
description: Instructions and guidelines for using @codexporer.io/app-analytics (App Analytics) in React Native and Expo applications.
---

# `@codexporer.io/app-analytics` Skill

## Overview
`@codexporer.io/app-analytics` is a unified cross-platform analytics facade supporting Firebase Analytics, AWS Amplify, and Facebook Analytics in React Native and Expo applications. It broadcasts events across all configured providers through a single API.

---

## When to Use
- Logging user interactions, screen views, and conversion milestones.
- Setting up user session IDs or persistent user traits.
- Sending custom attributes alongside telemetry data.

---

## Installation & Setup

```bash
yarn add @codexporer.io/app-analytics
```

### Root Initialization
Call `initialize` once at application startup before dispatching any events:

```tsx
import { initialize } from '@codexporer.io/app-analytics';

initialize({
  firebase: {
    config: { persistence: true }
  },
  facebook: {}
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

// Set authenticated user context
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

// Track screen transition
sendScreenEvent({
  screenName: 'VideoCreatorScreen',
  attributes: {
    entryPoint: 'gallery_action_sheet'
  }
});
```

---

## API Reference

### `initialize(params?: AnalyticsInitializeParams): void`
| Option | Type | Description |
| :--- | :--- | :--- |
| `firebase` | `FirebaseInitParams` (`{ config?, options? }`) | Configuration options for `@react-native-firebase/analytics` |
| `amplify` | `EventAttributes` | Options for AWS Amplify analytics |
| `facebook` | `EventAttributes` | Options for Facebook SDK App Events |

### `sendEvent(params: SendEventParams): void`
| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Event name (snake_case) |
| `attributes` | `EventAttributes` | No | Custom event attributes |

### `sendScreenEvent(params: SendScreenEventParams): void`
| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `screenName` | `string` | Yes | Name of the visited screen |
| `attributes` | `EventAttributes` | No | Screen context metadata |

### `setUserId(userId: string): void`
Sets current user ID across all active analytics providers.

### `setUserProperties(properties: EventAttributes): void`
Sets user attributes (`EventAttributes`) across all active analytics providers.

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
2. **Naming Convention**: Always use `snake_case` for event names (e.g., `filter_applied`, `preset_deleted`).
3. **Privacy**: Never include passwords, authorization headers, credit card data, or sensitive personal data in attributes.
