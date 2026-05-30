# Gugu Flash

Gugu Flash is a lightweight prototype for a Duoshan-like electronic badge content app.

The product loop:

1. Users browse interactive H5 badge content in a full-screen feed.
2. Users create or remix lightweight `GuguH5Pack` content.
3. Public content gets likes, saves, comments, completion, and remix signals.
4. Operators pick promising works as hardware candidates.
5. Official tools later adapt selected H5 packs into device firmware/story packages for GuguClub hardware.

This repo intentionally keeps the first app zero-dependency while the structure now follows the full-platform direction: shared product core first, then Web/H5, native app, mini program, and operator clients.

## Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:4177
```

Standalone operations console:

```text
http://127.0.0.1:4177/apps/operator/
```

Run the Web prototype with the Backend Alpha API for integration work:

```bash
npm run dev:all
```

Open:

```text
http://127.0.0.1:4177/apps/web/?api=http&apiBase=http%3A%2F%2F127.0.0.1%3A4188
```

Open the standalone Operator console against Backend Alpha:

```text
http://127.0.0.1:4177/apps/operator/?apiBase=http%3A%2F%2F127.0.0.1%3A4188
```

The Backend Alpha health check is:

```text
http://127.0.0.1:4188/flash/health
```

For same-Wi-Fi phone preview, expose the dev server on the local network:

```bash
HOST=0.0.0.0 npm run dev
```

Open the printed `Gugu Flash LAN URL` on your phone.

## GitHub Pages

This repo can be deployed as a GitHub Pages project site. The root `index.html`
redirects to `apps/web/`, and the web app uses relative asset paths so it works
under both local preview and URLs like:

```text
https://<user>.github.io/gugu-flash/
```

After pushing to GitHub, set `Settings -> Pages -> Source` to `GitHub Actions`.
The included `.github/workflows/pages.yml` deploys the static repo on pushes to
`main`.

## Structure

```text
docs/
  product-brief.md          Product architecture and MVP scope
  gugu-h5-pack-schema.md    H5 content format
data/
  seed-packs.json           Demo content
apps/
  web/
    index.html
    src/
      app.js                Web prototype screen rendering and events
      styles.css
      adapters/
        local-pack-store.js Local prototype persistence adapter
  native/                   Future iOS/Android shell
  miniprogram/              Future WeChat client
  operator/                 Standalone operations management console
    index.html              Standalone operations management backend
packages/
  core/
    src/
      index.js
      gugu-h5-pack.js       Shared schema helpers, ranking, draft/remix factories
  api-client/               Future shared HTTP/API layer
    src/
      index.js
      mock-flash-api.js     Mock API facade used before real backend switch
  design-tokens/            Future cross-platform visual tokens
scripts/
  dev-server.mjs            Static dev server
  check-content.mjs         Seed data/schema sanity checks
```

## Current Scope

- Mobile-first content feed
- Interactive H5 story player
- Standalone creator page opened from Mine, with AI-style draft generation
- Remix path
- Badge management with multi-device bind/switch/unbind
- Standalone store prototype with purchase/download/sync states for the active device
- Operator console for works, IP pool, review, governance, store, hardware, SLA, support, and operation logs
- Local persistence via `localStorage`

## Portability Notes

The prototype keeps product logic in `packages/core/` so it can move into native app, Web/H5, mini program, backend validator, or future framework clients without carrying browser UI code with it.

- `packages/core/src/gugu-h5-pack.js` is the shared content domain layer.
- `apps/web/src/adapters/local-pack-store.js` is replaceable; swap it for API calls when the real backend arrives.
- `apps/web/src/app.js` should stay thin: screen rendering, events, and calls into adapters.

## Not In This Prototype Yet

- Real login
- Real AI provider
- Real review queue
- Upload storage
- GuguClub backend publishing
- Hardware code generation

Those are deliberately left behind adapters so the first milestone stays focused on validating the user loop.
