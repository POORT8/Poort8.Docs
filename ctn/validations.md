# Validation Rules

Standard validation rules for CTN. Apply consistently across User Portal, Admin Portal, API, and BFF.

---

## Email

| Rule | Value |
|------|-------|
| Max length | 254 characters |
| Pattern | `^[^\s@]+@[^\s@]+\.[^\s@]+$` |

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

---

## KvK Number

Netherlands Chamber of Commerce identifier.

| Rule | Value |
|------|-------|
| Pattern | `^\d{8}$` |
| Example | `12345678` |

Format validation only — use KvK API for existence check during onboarding.

---

## Person Name (First / Last Name)

| Rule | Value |
|------|-------|
| Max length | 100 characters |

Applies to first name and last name fields during registration.

---

## Organization Name

| Rule | Value |
|------|-------|
| Min length | 2 characters |
| Max length | 255 characters |

---

## Client ID (System Registration)

| Rule | Value |
|------|-------|
| Pattern | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| Example | `my-api`, `logistics-app` |

Lowercase letters and digits only, separated by hyphens. Used when registering APIs and applications.

