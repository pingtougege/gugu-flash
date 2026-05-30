# Real Device Matrix Plan

This plan turns the Public MVP `real_device_matrix` blocker into a measurable hardware QA track. It does not claim that real devices have passed yet; it defines the exact evidence required before the gate can move to `ready`.

The machine-readable device lab evidence packet lives at `data/device-lab-evidence-packet.json` and is validated with `npm run check:device-lab-evidence`.

## Scope

The first public hardware target is Circle 185. Public MVP must be tested on at least two physical devices, with enough firmware, battery, storage, and BLE failure variation to prove that the Alpha fake BLE contract maps to real device behavior.

The matrix is owned by Native/Hardware Lead, with QA Lead validating evidence shape, Support Lead validating diagnostic usefulness, and Backend Lead validating that server records preserve the same `DeviceSyncEvidence v1` fields.

## Matrix Cases

| Case ID | Scenario | Expected Result |
| --- | --- | --- |
| `circle185_current_firmware_nominal` | Install an available HardwarePack on a Circle 185 running the current shipping firmware. | `installed` with readback matching the new pack. |
| `circle185_low_battery_block` | Attempt sync below the 20% battery threshold. | `blocked` with `low_battery` and a `GFS-*` diagnostic code. |
| `circle185_low_storage_block` | Attempt sync when available storage is below package size. | `blocked` with `insufficient_storage`. |
| `circle185_ble_disconnect_retry` | Disconnect BLE during sync and retry after reconnect. | First job records `ble_disconnected`; retry job links `retryOf` and completes or fails with clear evidence. |
| `circle185_write_failed_rollback` | Inject or reproduce a write failure after download. | `failed` with `write_failed`, previous content preserved or `rollback_required` recorded. |
| `circle185_verify_success` | Verify checksum, activate package, and read back current package. | `installed`, checksum verified, current hardware pack readback matches. |
| `circle185_legacy_delisted_use` | Keep a previously installed delisted HardwarePack running while blocking new sync. | Installed content keeps running; new sync is blocked with `hardware_pack_unavailable`. |

## Evidence Capture

Each real run must attach:

- `gugu_device_sync_evidence_v1` payload.
- BLE transcript or native client log showing `fake_ble_transport_v1` equivalent events.
- Device ID, firmware version, battery band, storage band, app/client version, and test operator.
- Diagnostic code using the `GFS-*` format when the case blocks or fails.
- Screenshot or structured readback proving the current installed pack after success, rollback, or legacy-use cases.

## Acceptance Criteria

The gate can move to `ready` only when:

- Two physical devices have completed the required matrix.
- At least one current shipping firmware and one previous supported firmware, or the nearest available spread, are represented.
- Every case ID in `DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS` has an attached real BLE session capture.
- QA has replayed the evidence against `packages/core/src/gugu-device-sync-evidence.js`.
- Support has confirmed diagnostic codes map to the support macros and playbook.

## Hardware Lead Handoff

Native/Hardware Lead must deliver a signed handoff packet containing:

- Matrix run sheet with pass/fail per case and device.
- Device lab evidence packet with device slots, firmware bands, capture requirements, QA replay status, Support handoff, and signoff fields.
- Raw logs or BLE captures for each case.
- Evidence JSON files for each DeviceSyncJob.
- Known firmware limitations and mitigation notes.
- Hardware lead signoff that the matrix is representative for Public MVP.

## External Work

The AI team can maintain the plan, evidence schema, fake BLE contract, and release gate. Physical device procurement, firmware availability, real BLE session capture, and hardware lead signoff remain external acceptance work.
