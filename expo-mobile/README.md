# Sixedi Shop Mobile

Expo app for previewing the shop on mobile with Expo Go.

## Run

1. Install dependencies:

   npm install

2. Start Expo:

   npm run start

3. Open in Expo Go or an emulator.

## Env

Set these environment variables before running:

- EXPO_PUBLIC_API_BASE_URL
- EXPO_PUBLIC_GOOGLE_CLIENT_ID
- EXPO_PUBLIC_FACEBOOK_CLIENT_ID

## Notes

- OAuth callback uses the app scheme `sixedishop://auth/callback`.
- Backend OAuth endpoints stay the same:
  - POST /api/auth/oauth/google
  - POST /api/auth/oauth/facebook
