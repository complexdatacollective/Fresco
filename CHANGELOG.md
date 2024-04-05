# Changelog

## 1.0.0-beta.2 (2024-04-05)

- Added a message for participants using mobile phones or small screen sizes, letting them know that they need to use a device with a larger screen to take the interview.
- Renamed the environment variable `DISABLE_ANALYTICS` to `NEXT_PUBLIC_DISABLE_ANALYTICS` to fix an issue where analytics events were still being sent when errors were thrown in client components.
- Disabled database migrations while we investigate a better way to handle them in the future.

## 1.0.0-beta.1 - (2024-03-29)

Initial beta release!
