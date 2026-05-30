# Launch Content Plan

This plan turns Public MVP `launch_content` from a vague content dependency into a concrete official launch set. It covers the first free HardwarePack, H5 fallback content, support handoff, and QA gates.

## Scope

Public MVP starts with a small, controlled launch set:

- One official free Circle 185 HardwarePack generated from approved seed content.
- Web/H5 fallback content for sharing and non-device browsing.
- No paid user-generated cash-share content in the launch set.
- Fanwork content remains Web/H5-only until rights review clears it.

The first launch HardwarePack is `hw_h5_rain_gugu`, generated from `h5_rain_gugu`.

## HardwarePack Launch Set

The machine-readable source of truth is `data/launch-hardware-packs.json`.

The launch HardwarePack must include:

- `gugu_launch_hardware_packs_v1` manifest version.
- `gugu_hardware_payload_v1` payload version.
- `official_free` pricing.
- `available` HardwarePack status.
- `approved` review status.
- Circle 185 compatibility report.
- SHA-256 checksum matching the payload.
- Offline use allowed for installed-device continuity.

## QA Smoke

Every launch HardwarePack must cover these smoke cases:

```text
launch_pack_schema_valid
circle185_compatibility_passed
checksum_matches_payload
offline_use_allowed
support_copy_ready
```

These cases prove that launch content is structurally publishable. Real device installation remains covered by the real device matrix and Hardware Studio production work.

## Support Handoff

Support needs the launch pack id, source pack id, checksum, package size, rollback policy, and linked macros before Public MVP.

Initial support copy:

```text
If the launch pack is already installed, it remains usable offline after delist unless legal or device-safety removal is required.
```

## External Boundary

This gate proves launch content data and export metadata are ready. It does not replace real Hardware Studio binary export, real device BLE install evidence, app store submission, legal counsel approval, or payment provider approval.
