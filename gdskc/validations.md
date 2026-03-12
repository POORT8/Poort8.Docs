# Validation Rules

Standard validation rules for GDS. Apply consistently across User Portal, Admin Portal, API, and BFF.

---

## Email

| Rule | Value |
|------|-------|
| Max length | 254 characters |
| Pattern | `^[^\s@]+@[^\s@]+\.[^\s@]+$` |

Client-side validation catches obvious format errors. Keycloak performs authoritative validation.

---

## Phone Number

| Rule | Value |
|------|-------|
| Storage format | E.164 (e.g., `+31612345678`) |
| Min digits | 10 |
| Max digits | 15 |
| Allowed input | Digits, `+`, spaces, hyphens, parentheses |
| Default country | NL (when no `+` prefix) |

### Examples

| Input | Stored as |
|-------|-----------|
| `06 12345678` | `+31612345678` (NL assumed) |
| `+32470123456` | `+32470123456` (BE) |
| `+49151123456` | `+49151123456` (DE) |

### Libraries

| Stack | Library |
|-------|---------|
| React (User Portal) | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) |
| C# (Admin Portal, API, BFF) | [libphonenumber-csharp](https://www.nuget.org/packages/libphonenumber-csharp) |

---

## KvK Number

Netherlands Chamber of Commerce identifier.

| Rule | Value |
|------|-------|
| Pattern | `^\d{8}$` |
| Example | `12345678` |

Format validation only — use KvK API for existence check during onboarding.

---

## EUID Format

The European Unique Identifier (EUID) assigned to each registered organization.

| Country | Format | Example |
|---------|--------|---------|
| Netherlands | `NLNHR.{kvkNumber}` | `NLNHR.12345678` |
