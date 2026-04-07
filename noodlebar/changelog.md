# Weekly Changelog

## 2026-04-03 — DSGO authentication endpoint (GIR) + sensor optimization workflow

### GIR Dataspace API

**Added**
- `POST /connect/token` — new endpoint for DSGO (DigiGO) authentication using JWT client assertions. Submit `grant_type`, `scope`, `client_id`, `client_assertion_type`, and `client_assertion` as `application/x-www-form-urlencoded`. The assertion is validated against the DSGO satellite trusted list using certificate chain verification. Returns a DSGO access token. This endpoint is only available on the GIR instance. [#618](https://github.com/POORT8/Poort8.Dataspace.Private/pull/618) [#826](https://github.com/POORT8/Poort8.Dataspace.Private/pull/826)

### Keyper API

**Added**
- A new sensor optimization workflow `keyper.sensor-optimization@v1` is now available. Pass `keyper.sensor-optimization@v1` as `orchestration.flow` in `POST /api/approval-links` to use a Dutch-language sensor optimization approval flow. Unlike the default workflow, this flow does not require the approver to be a member of the requesting organization. [#820](https://github.com/POORT8/Poort8.Dataspace.Private/pull/820)

## 2026-03-27 — Keyper default workflow + onboarding PDF fix

### Dataspace API

**Fixed**
- `POST /api/onboarding` now correctly validates PDF files submitted as `BusinessRegisterExtract`. Previously, valid PDF files could be incorrectly rejected due to a stream positioning issue during header validation. [#801](https://github.com/POORT8/Poort8.Dataspace.Private/pull/801)

### Keyper API

**Added**
- A new generic English-language workflow `keyper.default@v1` is now available. Pass `keyper.default@v1` as `orchestration.flow` in `POST /api/approval-links` to use a standard dataspace approval flow without a dataspace-specific customization. [#817](https://github.com/POORT8/Poort8.Dataspace.Private/pull/817)

## 2026-03-20 — Multi-country organization registration + onboarding contract changes

The onboarding endpoint now supports Dutch, Belgian, and German organizations, with live registry verification for each country. This release contains two breaking changes to `POST /api/onboarding` — existing integrations must update before upgrading.

### Dataspace API

**Breaking**
- `POST /api/onboarding` now requires `multipart/form-data` encoding instead of JSON, a new required `CountryCode` field (`NL`, `BE`, or `DE`), and renames `KvkNumber` to `BusinessRegisterNumber`. Update your `Content-Type` header to `multipart/form-data`, add `CountryCode: NL` for Dutch registrations, and rename the field in your payload. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)
- `POST /api/onboarding` now requires phone numbers in international E.164 format (e.g., `+31612345678`). Numbers in local format (e.g., `0612345678`) are rejected with a validation error. Add the country dialing prefix to your phone number value. [#786](https://github.com/POORT8/Poort8.Dataspace.Private/pull/786)

**Added**
- `POST /api/onboarding` now accepts Belgian organization registrations. Set `CountryCode` to `BE` and provide a KBO number as `BusinessRegisterNumber`. The KBO number is verified against the official Belgian business registry — a `KboCheck` verification record is created during provisioning. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762) [#768](https://github.com/POORT8/Poort8.Dataspace.Private/pull/768)
- `POST /api/onboarding` now accepts German organization registrations. Set `CountryCode` to `DE`, provide a commercial register number as `BusinessRegisterNumber` (HRB format, e.g., `HRB12345`), and optionally supply a court code in the new `RegistrationCourt` field. The organization's LEI is looked up automatically via the GLEIF registry. [#789](https://github.com/POORT8/Poort8.Dataspace.Private/pull/789)
- `POST /api/onboarding` now accepts an optional `BusinessRegisterExtract` field — a PDF upload of the business register extract. [#762](https://github.com/POORT8/Poort8.Dataspace.Private/pull/762)
- `POST /api/onboarding` now accepts an optional `Vat` field for the organization's VAT number. [#785](https://github.com/POORT8/Poort8.Dataspace.Private/pull/785) [#789](https://github.com/POORT8/Poort8.Dataspace.Private/pull/789)

**Changed**
- `POST /api/onboarding` now returns 400 when the submitted `CountryCode` is not accepted by this dataspace instance. [#770](https://github.com/POORT8/Poort8.Dataspace.Private/pull/770)
- Belgian organizations onboarded via `POST /api/onboarding` now receive a `VatCheck` verification record during provisioning. The VAT number is automatically derived from the KBO number and verified against the EU VIES service. [#785](https://github.com/POORT8/Poort8.Dataspace.Private/pull/785)

### Keyper API

**Changed**
- Users who authenticate successfully but are not authorized to approve for their organization now see a dedicated error screen, rather than being redirected back to the authentication step. [#715](https://github.com/POORT8/Poort8.Dataspace.Private/pull/715) [#763](https://github.com/POORT8/Poort8.Dataspace.Private/pull/763)
