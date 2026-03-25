# DDS Dashboard Mobile App

Cross-platform mobile application (iOS & Android) for the DDS Union Steward Dashboard, built with React Native and Expo.

## Architecture

- **Frontend:** React Native + Expo SDK 52, TypeScript
- **Backend:** Existing Google Apps Script web app via HTTP POST API bridge
- **Auth:** Google Sign-In (primary), PIN login (member-only limited view), Magic link (email)
- **Storage:** Expo SecureStore (tokens), AsyncStorage (offline cache)
- **Navigation:** React Navigation (role-based: steward tabs vs member tabs)
- **Theme:** Dynamic theme system matching the web app's 8 presets + dark mode
- **Offline:** Stale-while-revalidate caching, queued writes
- **Notifications:** Expo Push Notifications + local deadline reminders

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to run on your device.

## Building for Production

```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production
```

## Setup

1. Deploy the GAS web app with the `34_MobileAPI.gs` bridge
2. On first launch, enter the GAS web app URL
3. Sign in with your Google account or email magic link

## Project Structure

```
mobile/
├── App.tsx                    # Root component
├── app.json                   # Expo config
├── src/
│   ├── api/                   # HTTP client + endpoint wrappers
│   │   ├── client.ts          # Fetch wrapper with retry
│   │   ├── config.ts          # API URL configuration
│   │   └── endpoints.ts       # Typed wrappers for 80+ data* functions
│   ├── auth/                  # Authentication
│   │   ├── AuthContext.tsx     # Global auth state provider
│   │   └── session.ts         # SecureStore token management
│   ├── components/            # Reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── KPICard.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── SearchBar.tsx
│   │   └── StatusChip.tsx
│   ├── hooks/                 # Custom React hooks
│   ├── navigation/            # React Navigation setup
│   │   ├── RootNavigator.tsx  # Auth → Steward/Member routing
│   │   ├── StewardNavigator.tsx # 5-tab steward navigation
│   │   └── MemberNavigator.tsx  # 3-tab member navigation
│   ├── screens/               # Screen components
│   │   ├── auth/              # Login, Setup
│   │   ├── steward/           # Dashboard, Cases, Members, Tasks, Insights
│   │   ├── member/            # Dashboard, My Grievances
│   │   └── shared/            # Profile, Notifications
│   ├── theme/                 # Dynamic theming
│   │   ├── colors.ts          # 8 theme presets + light/dark
│   │   ├── tokens.ts          # Spacing, typography, border radius
│   │   └── ThemeContext.tsx    # Theme provider with dark mode toggle
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utilities
│       ├── notifications.ts   # Push notification setup
│       └── offline.ts         # AsyncStorage cache + SWR pattern
└── assets/                    # Icons, splash screen
```

## GAS API Bridge

The mobile app communicates with the GAS backend via `src/34_MobileAPI.gs`, which adds a `doPost(e)` handler. Each request is a JSON POST with:

```json
{
  "action": "dataGetStewardCases",
  "sessionToken": "..."
}
```

The bridge routes to the existing `data*` functions — no business logic is duplicated.
