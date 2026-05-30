# Gugu Flash Asset Security Readiness

This gate defines Alpha controls for user-uploaded assets before public file uploads are enabled.

## Scope

Asset security covers upload metadata, media type, file size, source URL, source statement, storage isolation, and review handoff. It does not claim production malware scanning or object-store isolation is already deployed.

## Upload Policy

The policy version is `gugu_flash_asset_security_v1`.

Allowed media types:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`
- `audio/mpeg`
- `audio/wav`
- `audio/ogg`
- `application/json`

Blocked examples include executable formats, shell files, HTML, SVG, private or localhost source URLs, oversized files, and missing rights acknowledgement.

## Source Statement

Every asset must include a source statement with `sourceType`, creator or license evidence, and `rightsAcknowledged = true`. Notes must not include external contact or transaction links.

## Backend Enforcement

`POST /flash/assets` rejects invalid payloads with `asset_security_violation`. `PATCH /flash/assets/:id/source-statement` rejects invalid source statements with `asset_source_statement_invalid`. `POST /flash/assets/:id/submit-review` returns required checks for malware scanning, content-type validation, source statement, and storage isolation.

## External Boundary

The AI team can maintain policy validation, HTTP enforcement, tests, and readiness gates. Public MVP still needs real malware scanning, private object-store isolation, retention policy verification, and external security signoff.
