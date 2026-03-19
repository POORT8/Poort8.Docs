# Changelog

## 2026-03-18 — KBO API verification for Belgian onboarding + country restriction enforcement

Two follow-up changes to the Belgian registration feature shipped on 2026-03-17.

### Dataspace API

**Changed**
- Belgian organizations registering via `POST /api/onboarding` are now verified against the official Belgian KBO registry API. A `KboCheck` verification record is created during provisioning, matching the `KvkCheck` behavior for Dutch organizations. Invalid KBO numbers that pass format validation may now be rejected if they are not found in the KBO registry. [#768](https://github.com/POORT8/Poort8.Dataspace.Private/pull/768)
- `POST /api/onboarding` now returns a 400 validation error when the submitted `CountryCode` is excluded from the dataspace's allowed countries. Dataspace operators can restrict available countries via the `ParticipantRegistry.ExcludeCountryCodes` configuration. [#770](https://github.com/POORT8/Poort8.Dataspace.Private/pull/770)

## 2026-03-17 — Belgian organization registration + onboarding endpoint breaking changes

Belgian organizations can now register on the platform using their KBO number. This release also
changes the onboarding endpoint contract in three ways — existing integrations must update before upgrading.

### Dataspace API

**Breaking**
- `POST /api/onboarding` now accepts `multipart/form-data` instead of JSON. Update your `Content-Type` header to `multipart/form-data` and encode request fields accordingly. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)
- `POST /api/onboarding` now requires a `CountryCode` field. Set it to `NL` for Dutch registrations or `BE` for Belgian registrations. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)
- The `KvkNumber` field is renamed to `BusinessRegisterNumber`. Update your request payload to use the new field name. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)

**Added**
- `POST /api/onboarding` now accepts Belgian organization registrations. Set `CountryCode` to `BE` and provide a KBO number as `BusinessRegisterNumber`. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)
- `POST /api/onboarding` now accepts an optional `BusinessRegisterExtract` field — a PDF file upload of the business register extract. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)

### Keyper API

**Changed**
- Users who authenticate successfully but are not authorized to approve for their organization now see a dedicated error screen with a clear "not authorized" message, rather than being redirected back to the authentication step. Affects GIR, GDS, and DVU approval workflows. [#715](https://github.com/POORT8/Poort8.Dataspace.Private/pull/715) [#763](https://github.com/POORT8/Poort8.Dataspace.Private/pull/763)
