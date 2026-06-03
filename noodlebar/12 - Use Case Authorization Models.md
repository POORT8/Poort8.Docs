# 12: Use Case Authorization Models

Every policy stored in the Authorization Registry has a `useCase` field. This field determines which **authorization enforcement model** is applied when the policy is evaluated. The model controls how Casbin interprets the policy — for example, whether iSHARE-specific fields such as `serviceProvider`, `type`, and `attribute` are required.

## Authorization Models

| Model | Description |
|-------|-------------|
| `default` | Simple subject / resource / action enforcement. Use for basic non-iSHARE dataspaces. |
| `ishare` | Full iSHARE-compliant enforcement. Requires `serviceProvider`, `type`, `attribute`, and `license`. |
| `isharerules` | Extends `ishare` with custom rule enforcement (used for e.g. GIR building classifications). |

## Use Case to Model Mapping

The registry resolves a use case string to an authorization model in two steps:

1. **Exact match** — look up the full use case string (case-insensitive).
2. **Family fallback** — if no exact match is found, take the part before the first `.` and look that up.

This means a use case like `portlinq.default` resolves to `portlinq` → `ishare`, and `dsgo.gir` resolves to `dsgo` → `isharerules`. You can therefore add new use cases within an existing family without any configuration changes — the family entry covers them automatically.

If neither the full use case nor its family prefix is in the table, the registry defaults to `default`.

### Known Mappings

| Use case (prefix or full) | Authorization model |
|---------------------------|---------------------|
| `keyper` | `ishare` |
| `portlinq` | `ishare` |
| `gds` | `ishare` |
| `dvu` | `ishare` |
| `gir` | `isharerules` |
| `dsgo` | `isharerules` |
| `ishare` | `ishare` |
| `isharerules` | `isharerules` |
| `hwct` | `default` |
| `efti` | `ishare` |
| `inlandcontainerdata` | `ishare` |
| `co2emissiesperperiode` | `ishare` |
| `uitbesteedtransport` | `ishare` |
| `binnenvaart` | `ishare` |
| `unspecified` | `ishare` |
| `auto` | `ishare` |

Any use case not in this table, and whose prefix is also not in the table, falls back to `default`.

## How Keyper Sets the Use Case

When an approval link is created via Keyper, policy transactions may omit the `useCase` field. In that case, Keyper derives the use case automatically from the `orchestration.flow` value by stripping the version suffix:

```
orchestration.flow = "portlinq.default@v1"
→ derived useCase  = "portlinq.default"
→ authorization model = "ishare"  (via family "portlinq")
```

If `useCase` is provided explicitly on a policy transaction, that value takes precedence.

See the [Keyper documentation](../keyper/README.md#policy-use-cases) for more details on approval link flows.
