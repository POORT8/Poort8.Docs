# Tokens valideren

Deze gids is voor **bunker suppliers** die hun eigen bunkerdiensten-API willen beveiligen met een NoodleBar-uitgegeven access token, bijvoorbeeld wanneer een app namens een schip rechtstreeks bij jouw API een reservering plaatst. Hij beschrijft hoe je zo'n JWT access token valideert.

> ℹ️ **Optioneel.** De bunker diensten API en supplier-infrastructuur vallen buiten deze documentatie (zie [Bunker Diensten Toegang](bunker-diensten.md)). Deze pagina is relevant als je ervoor kiest om apps/schepen via BunkerConnect/Keycloak te laten authenticeren bij jouw eigen API. Als je autorisatie op een andere manier regelt, heb je alleen [Autorisatie valideren](autorisatie.md) nodig.

## Voorwaarden

| Voorwaarde | Beschrijving |
|------------|--------------|
| Organisatie geregistreerd | Je organisatie is geregistreerd en goedgekeurd in BunkerConnect |
| Applicatie geregistreerd | Je hebt een applicatie geregistreerd in het Self-Service Portal |
| AR-toegang | Voor de autorisatie-check (zie [Autorisatie valideren](autorisatie.md)) heeft je applicatie toegang tot de **BunkerConnect Authorization Registry** (`noodlebar-api`) nodig — zie [AR-toegang aanvragen](api-toegang-aanvragen.md) |

## Validatiestappen

Voer deze checks uit in deze volgorde. Weiger het verzoek direct als een check faalt.

| # | Check | Wat te verifiëren | Bij falen |
|---|-------|-------------------|-----------|
| 1 | **Handtekening** | JWT-handtekening geldig tegen de publieke sleutels van BunkerConnect (JWKS) | `401 Unauthorized` |
| 2 | **Vervaldatum** | `exp`-claim ligt in de toekomst | `401 Unauthorized` |
| 3 | **Issuer** | `iss` is gelijk aan `https://auth.poort8.nl/realms/bunkerconnect-preview` | `401 Unauthorized` |
| 4 | **Audience** | `aud` bevat de client ID van jouw eigen applicatie/API | `403 Forbidden` |
| 5 | **Organisatie** | `organization`-claim is aanwezig en bevat een EUID-waarde | Gebruik voor business-logica |

> **Stap 4 is cruciaal.** Zonder audience-validatie kan een token dat voor een andere applicatie bedoeld is, bij jouw API worden hergebruikt. Controleer altijd dat de client ID van jouw applicatie in de `aud`-claim voorkomt.

## JWKS- en discovery-endpoints

BunkerConnect publiceert zijn signing keys op:

```
https://auth.poort8.nl/realms/bunkerconnect-preview/protocol/openid-connect/certs
```

OIDC-discovery:

```
https://auth.poort8.nl/realms/bunkerconnect-preview/.well-known/openid-configuration
```

Haal de sleutels op en cache ze bij het opstarten van je applicatie. De meeste JWT-libraries verversen automatisch bij een onbekende `kid` (key ID).

## Token-claims

De gedecodeerde token payload:

```json
{
  "iss": "https://auth.poort8.nl/realms/bunkerconnect-preview",
  "aud": "YOUR_CLIENT_ID",
  "exp": 1711324800,
  "iat": 1711324500,
  "client_id": "APP_CLIENT_ID",
  "organization": {
    "NLNHR.11223344": {
      "KVK": ["11223344"],
      "EORI": ["NL811223344"],
      "EUID": ["NLNHR.11223344"],
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

| Claim | Beschrijving |
|-------|--------------|
| `iss` | Token issuer — moet het BunkerConnect Organization Registry (OR) zijn |
| `aud` | Doel-audience — moet het client ID van jouw applicatie/API bevatten |
| `exp` | Vervaltijd (Unix timestamp) |
| `client_id` | Client ID van de aanroepende applicatie |
| `organization` | Geverifieerde organisatie-identiteit van de aanroeper, met één of meer identifier-types |

## Organisatie-identifier afleiden

Na succesvolle tokenvalidatie leid je de organisatie-identifier af uit de `organization`-claim. Dat is een Keycloak-specifieke JSON-structuur die per organisatie meerdere identifier-types als arrays kan bevatten (zoals `KVK`, `EORI` en `EUID`). De gekozen identifier in BunkerConnect is **EUID** (`NLNHR.{kvkNummer}`).

Gebruik de afgeleide EUID consistent als `subject` in `explained-enforce`-verzoeken (zie [Autorisatie valideren](autorisatie.md)).

Algoritme:
1. Loop door de organisaties in het `organization`-object
2. Controleer per organisatie of het `EUID`-attribuut bestaat en een niet-lege array is
3. Neem het eerste array-item als organisatie-identifier

Weiger met `403 Forbidden` wanneer:
- de `organization`-claim ontbreekt
- de `organization`-claim geen geldig JSON-object is
- het `EUID`-attribuut ontbreekt of leeg is voor alle organisaties

## Volgende stappen

Tokenvalidatie bevestigt *wie* je aanroept. Om te verifiëren *welke bunkerdienst* toegestaan is, zie [Autorisatie valideren](autorisatie.md).

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.
