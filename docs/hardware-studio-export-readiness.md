# Gugu Flash Hardware Studio Export Readiness

This gate defines the Alpha export package that hands an approved HardwarePack from Gugu Flash backend into Gugu Flash Hardware Studio.

## Scope

The export package proves that an H5 work can be transformed into a deterministic hardware adaptation artifact before native packaging. It does not claim a physical device install, signed native shell, or final Hardware Studio binary build has happened.

## Export Bundle

The bundle version is `gugu_hardware_studio_export_v1`. Each ready bundle includes:

- `manifest.json`
- `payload/story.json`
- `compatibility-report.json`
- `checksums.sha256`

The manifest points to the payload and compatibility report, preserves the source work/version ids, includes the target device profile, and embeds the HardwarePack metadata. `hardwarePack.checksum` must match the deterministic checksum of `payload/story.json`.

## Backend Route

The operator route is `POST /flash/operator/hardware-packs/:id/export-to-hardware-studio`. It requires `hardware_operator` permission and returns the export bundle plus top-level compatibility, hardwarePack, and payload references for clients that need quick inspection.

## QA Acceptance

- Compatible packs produce `status = ready_for_hardware_studio`.
- Incompatible packs produce `status = blocked` with the compatibility report attached.
- Export file entries include byte counts and SHA-256 checksums.
- HTTP Alpha tests verify the operator route, the client facade, and Hardware Studio file list.
- RBAC tests keep reviewer and support roles from using hardware export.

## External Boundary

The AI team can maintain deterministic export structure, route coverage, checksum validation, and tests. Closed beta still needs real Hardware Studio binary packaging, native install package generation, real device signoff, and a named Hardware Studio owner.
