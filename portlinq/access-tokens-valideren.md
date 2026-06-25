# Tokens valideren

Deze gids is voor **Charlie** — een data service provider die API's aanbiedt in de PortlinQ-dataspace. Hij beschrijft hoe je de JWT access tokens valideert die consumers meesturen wanneer ze jouw API aanroepen.

## Voorwaarden

| Voorwaarde | Beschrijving |
|------------|--------------|
| Organisatie geregistreerd | Je organisatie is geregistreerd en goedgekeurd in PortlinQ |
| API geregistreerd | Je API is geregistreerd in het Self-Service Portal |
| API geïmplementeerd | Je hebt een API die verzoeken kan ontvangen en tokens kan valideren |
| NoodleBar API-toegang | Voor de autorisatie-check (zie [Autorisatie valideren](autorisatie.md)) heb je een **apart geregistreerde applicatie** met toegang tot de **NoodleBar API** nodig |

> **Als data service provider heb je twee rollen.** Je registreert je eigen API zodat consumers hem kunnen vinden en toegang kunnen aanvragen. Om autorisatie op inkomende verzoeken te verifiëren, treed je daarnaast op als *consumer* van de PortlinQ Authorization Registry (in het portal de **NoodleBar API**). Dat vereist een aparte applicatie met goedgekeurde toegang tot de NoodleBar API. Zie [API-toegang aanvragen](api-toegang-aanvragen.md) voor de registratiestappen.

## Validatiestappen

Voer deze checks uit in deze volgorde. Weiger het verzoek direct als een check faalt.

| # | Check | Wat te verifiëren | Bij falen |
|---|-------|-------------------|-----------|
| 1 | **Handtekening** | JWT-handtekening geldig tegen de publieke sleutels van PortlinQ (JWKS) | `401 Unauthorized` |
| 2 | **Vervaldatum** | `exp`-claim ligt in de toekomst | `401 Unauthorized` |
| 3 | **Issuer** | `iss` is gelijk aan `https://auth.poort8.nl/realms/portlinq-preview` | `401 Unauthorized` |
| 4 | **Audience** | `aud` bevat de client ID van jouw API | `403 Forbidden` |
| 5 | **Organisatie** | `organization`-claim is aanwezig en bevat een EUID-waarde | Gebruik voor business-logica |

> **Stap 4 is cruciaal.** Zonder audience-validatie kan een token dat voor een andere API bedoeld is, bij jouw API worden hergebruikt. Controleer altijd dat de client ID van jouw API in de `aud`-claim voorkomt.

## JWKS- en discovery-endpoints

PortlinQ publiceert zijn signing keys op:

```
https://auth.poort8.nl/realms/portlinq-preview/protocol/openid-connect/certs
```

OIDC-discovery:

```
https://auth.poort8.nl/realms/portlinq-preview/.well-known/openid-configuration
```

Haal de sleutels op en cache ze bij het opstarten van je applicatie. De meeste JWT-libraries verversen automatisch bij een onbekende `kid` (key ID).

## Token-claims

Een gedecodeerd token van een PortlinQ-consumer:

```json
{
  "iss": "https://auth.poort8.nl/realms/portlinq-preview",
  "aud": "YOUR_API_CLIENT_ID",
  "exp": 1711324800,
  "iat": 1711324500,
  "client_id": "CONSUMER_APP_CLIENT_ID",
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
| `iss` | Token issuer — moet de PortlinQ Associatieregister (ASR) zijn |
| `aud` | Doel-audience — moet de client ID van jouw API bevatten |
| `exp` | Vervaltijd (Unix timestamp) |
| `client_id` | Client ID van de consumer-applicatie |
| `organization` | Geverifieerde organisatie-identiteit van de consumer, met één of meer identifier-types |

## Organisatie-identifier afleiden

Na succesvolle tokenvalidatie leid je de organisatie-identifier af uit de `organization`-claim. Dat is een Keycloak-specifieke JSON-structuur die per organisatie meerdere identifier-types als arrays kan bevatten (zoals `KVK`, `EORI`, `LEI` en `EUID`). De gekozen identifier in PortlinQ is **EUID** (`NLNHR.{kvkNummer}`).

Gebruik de afgeleide EUID consistent als:
- `subject` in `explained-enforce`-verzoeken (zie [Autorisatie valideren](autorisatie.md))
- identiteit voor logging en auditing per organisatie

Algoritme:
1. Loop door de organisaties in het `organization`-object
2. Controleer per organisatie of het `EUID`-attribuut bestaat en een niet-lege array is
3. Neem het eerste array-item als organisatie-identifier

Weiger met `403 Forbidden` wanneer:
- de `organization`-claim ontbreekt
- de `organization`-claim geen geldig JSON-object is
- het `EUID`-attribuut ontbreekt of leeg is voor alle organisaties

## Volgende stappen

Tokenvalidatie bevestigt *wie* je API aanroept. Om te verifiëren *welke data* ze mogen benaderen, zie [Autorisatie valideren](autorisatie.md).

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.