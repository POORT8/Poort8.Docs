# API Versioning

For general information about how we version our APIs, see the [API Versioning Policy](/api-versioning.md).

## GIR API Versioning

GIR is built on top of NoodleBar and shares many of its endpoints. However, GIR also has its own specific endpoints. These are treated as a **separate API product** with their own versioning.

This means:

- **NoodleBar endpoints** (e.g., `/policies`, `/approval-links`) follow the general NoodleBar version
- **GIR-specific endpoints** (e.g., `/GIRBasisdataMessage`) have their own version, independent of the NoodleBar version

As a result, the version numbers for NoodleBar endpoints and GIR-specific endpoints may differ. When a breaking change occurs on a NoodleBar endpoint, only that version increments. GIR-specific endpoints remain on their current version, and vice versa.

## Changelog

See the [changelog](changelog.md) for a list of breaking changes to GIR-specific endpoints.
