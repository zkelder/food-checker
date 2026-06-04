# Mobile Release Pipeline

## Overview

Food Checker uses Expo / React Native with EAS build profiles for development,
preview, and production. EAS Update is configured for future JavaScript, style,
and copy updates when native code and native dependencies do not change.

The first full build after this setup is required before OTA updates can reach
installed apps.

## What Requires A Full Build

Run a full EAS build when any native runtime input changes, including:

- Expo SDK or React Native version changes.
- Native dependencies, plugins, permissions, or app config changes.
- iOS bundle identifier, Android package, icons, splash screen, or build properties.
- `runtimeVersion`, `updates.url`, or EAS channel/profile changes.
- Any change that requires App Store/TestFlight review.

## What Can Use EAS Update

Use EAS Update for changes that stay within the existing native runtime, such as:

- JavaScript or TypeScript logic.
- Copy, styling, and layout changes.
- Non-native assets bundled by Expo.
- Small UI fixes that do not require native dependency or app config changes.

## Build Channels

Configured build channels:

- `development`: internal development client builds.
- `preview`: internal preview/TestFlight-style builds.
- `production`: App Store/TestFlight production profile builds.

## Production Build

```bash
cd mobile
eas build --platform ios --profile production
```

This is still a manual step. Do not publish an OTA update expecting it to work
until users have installed a build created after EAS Update was configured.

## Production OTA Update

```bash
cd mobile
eas update --branch production --message "Describe the JS/style/copy change"
```

Use this only for changes that do not require a native rebuild.

## Preview OTA Update

```bash
cd mobile
eas update --branch preview --message "Describe the preview change"
```

Use preview updates to test JavaScript/style/copy changes before production.

## Inspect Channels And Branches

```bash
cd mobile
eas channel:list
eas branch:list
```

Confirm channels point to the intended branches before publishing an update.

## Environment Configuration

Current `eas.json` keeps public Expo environment values inline so existing
manual builds continue to work. These values are public client configuration,
but the cleaner long-term setup is to move them into EAS environment variables:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Do not add `EAS_TOKEN`, Apple credentials, or other secrets to the repo.

## Safety Checklist

Before publishing an OTA update:

1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. Run `npx expo config --type public`.
4. Confirm the change does not require native code, native dependencies, or app config updates.
5. Publish to `preview` first when practical.
