# @gugu-flash/api-client

Future shared API client package.

Primary responsibilities:

- feed and work APIs
- creation, remix, comments, interactions
- auth/session adapters per platform
- upload and asset APIs
- operator and hardware candidate APIs

Keep transport details here so clients do not call backend endpoints directly from UI components.

Current implementation:

- `src/mock-flash-api.js` exposes the first API facade.
- It uses injected persistence functions, so Web can use `localStorage` now and a real HTTP backend later.
- Method names mirror the future backend route plan in `docs/full-platform-execution-plan.md`.
- The main social entry now uses `getFriends()`; creator and device data live under Mine/Profile surfaces.
