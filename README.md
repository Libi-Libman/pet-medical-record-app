# Pet medical record app

Expo (React Native) + Expo Router + NativeWind + TypeScript, talking directly
to Supabase (Postgres + Auth). See `pet-medical-record-app-spec.md` for the
full product spec.

## Architecture

- **Data**: Supabase Postgres (Frankfurt, EU — required for GDPR). The client
  queries tables directly via `@supabase/supabase-js`.
- **Access control**: Postgres Row-Level Security (RLS), not application code.
  Every table needs owner-scoped policies — see `supabase/rls-policies.sql`
  for the `pets` table and the pattern to copy for new tables.
- **Auth**: Supabase Auth, passwordless email-code sign-in (`src/context/auth.tsx`,
  `src/app/login.tsx`). No passwords to manage, no deep-link/redirect handling
  to get right on native — you request a 6-digit code by email and enter it.

There is no separate backend service — no custom API server, no ORM. It was
briefly attempted (Bun + tRPC + Drizzle) while a backend developer was going
to build it out; that didn't fit the release timeline, so the app went back
to talking to Supabase directly, which is also GDPR-simpler for a solo dev
to reason about (RLS policies live next to the schema, not in app code).

## Setup

1. `npm install` (or `bun install`).
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL
   and anon/publishable key (Supabase dashboard → Project Settings → API).
3. In the Supabase SQL editor, run `supabase/rls-policies.sql` once against
   your project. Without it, direct queries from the app will return nothing
   (RLS is enabled on `pets` with no policies yet — Postgres denies by
   default).
4. In the Supabase dashboard, go to Authentication → Email Templates →
   Magic Link, and make sure the template includes `{{ .Token }}` (the
   6-digit code), not just `{{ .ConfirmationURL }}`. The sign-in flow here
   uses the code, not the link.
5. `npx expo start --web` (web is the only tested target so far — see
   "Native device testing" below).

## Known-tricky config (already solved, don't relitigate)

- `app.json` needs `"web": { "output": "single" }` — disables SSR, which
  crashed on `window is not defined` from Supabase's auth client running
  during server-side render.
- `babel.config.js` needs `"nativewind/babel"` as a **preset**, not a plugin,
  alongside `babel-preset-expo` with `jsxImportSource: "nativewind"`.
- `tailwind.config.js` needs `darkMode: 'class'` and
  `content: ["./src/**/*.{js,jsx,ts,tsx}"]`.
- `@react-native-community/datetimepicker` doesn't support web. `capture.tsx`
  branches on `Platform.OS === 'web'` and renders a raw HTML `<input
  type="date">` there, the real picker on native.

## Native device testing — currently blocked

Expo SDK 57, but Expo Go on the App Store is stuck on SDK 54 (Apple review
backlog on Expo's end). A development build (`eas build --profile
development`) needs an Apple Developer account ($99/yr), deliberately not
purchased yet — get it when camera capture, push notifications, or App Store
submission actually require it. Until then: web only.

## Design system — color language (locked)

| Color  | Meaning                                              |
| ------ | ----------------------------------------------------- |
| Amber  | Condition actively being treated or recovering        |
| Green  | Chronic condition, stable and well managed             |
| Purple | Medications — consistently, on every screen             |
| Blue   | Actions, navigation, links, current/ongoing status       |
| Red    | Allergies, complications, anything safety-critical        |
| Gray   | Structural: categories, completed items, chrome          |

## Accessibility approach (deliberate)

No `accessibilityRole`/`accessibilityLabel`/`accessibilityState` props —
accessibility is scoped to color contrast (WCAG AA) and font sizing (12px /
`text-xs` minimum everywhere) instead of screen-reader semantics.
