# @gugu-flash/core

Shared product domain for all clients.

Owns:

- Gugu Flash backend entity schemas and status constants
- `GuguH5Pack` helpers and validation
- feed ranking primitives
- draft and remix factories
- hardware candidate labels and lifecycle constants
- device sync evidence and fake BLE transport contract validation

This package must not depend on browser, WeChat, native, or backend-only APIs.
