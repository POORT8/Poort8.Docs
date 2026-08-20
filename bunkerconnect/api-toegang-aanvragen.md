# AR-toegang aanvragen

Deze gids is voor **bunker suppliers** die policies willen registreren in de BunkerConnect Authorization Registry (AR) en autorisatie willen controleren voordat ze een bunkerdienst leveren. Hij beschrijft het proces van applicatie-registratie tot het aanroepen van de AR.

## Voorwaarden

| Voorwaarde | Beschrijving |
|------------|--------------|
| Organisatie geregistreerd | Je organisatie is geregistreerd en goedgekeurd in BunkerConnect — zie [Organisatie Registratie](onboarding.md) |
| Account actief | Je hebt een actief account op het [Self-Service Portal](https://bunkerconnect-preview.poort8.nl/portal) |
| Applicatie geregistreerd | Je hebt een applicatie geregistreerd — zie [Self-Service Portal](self-service-portal.md) |

## Stap 1 — Registreer je applicatie

Zie [Self-Service Portal — Applicatie registreren](self-service-portal.md#applicatie-registreren) als je dit nog niet hebt gedaan. Na registratie heb je een `client_id` en `client_secret`.

## Stap 2 — Vraag toegang tot de Authorization Registry aan

Om policies te mogen registreren en de AR te mogen bevragen heeft je applicatie toegang tot de BunkerConnect Authorization Registry (`noodlebar-api`) nodig. Neem contact op met Poort8 via **hello@poort8.nl** om deze toegang voor je geregistreerde applicatie te laten activeren.

## Stap 3 — Vraag een access token aan

Gebruik de **OAuth Client Credentials**-grant om een access token op te halen.

```bash
curl -X POST https://auth.poort8.nl/realms/bunkerconnect-preview/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=noodlebar-api"
```

| Parameter | Waarde | Beschrijving |
|-----------|--------|--------------|
| `grant_type` | `client_credentials` | Altijd deze waarde voor M2M-authenticatie |
| `client_id` | Je applicatie-client-ID | Getoond in het portal na registratie |
| `client_secret` | Je applicatie-client-secret | Getoond in het portal na registratie |
| `scope` | `noodlebar-api` | Vereist om de Authorization Registry aan te roepen |

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "noodlebar-api organization"
}
```

> ⏱️ **Token-lifetime:** access tokens zijn kortlevend. Vraag een nieuw token aan voordat het huidige verloopt; cache tokens niet langer dan hun geldigheid.

## Stap 4 — Registreer een policy

Gebruik het access token om een policy te registreren die vastlegt welke app/schip toegang heeft tot jouw bunkerdienst:

```http
POST https://bunkerconnect-preview.poort8.nl/v1/api/policies
Authorization: Bearer {access_token}
Content-Type: application/json
```
```json
{
  "issuerId": "NLNHR.87654321",
  "subjectId": "[TBD - identifier van de app/het schip]",
  "serviceProvider": "NLNHR.87654321",
  "action": "[TBD - bijv. reserve of order]",
  "resourceId": "[TBD - bunker dienst resource ID]",
  "type": "[TBD - instance specifiek]",
  "useCase": "default",
  "attribute": "*",
  "issuedAt": 1738368000,
  "notBefore": 1738368000,
  "expiration": 1769904000
}
```

`issuerId` en `serviceProvider` zijn beide de EUID van jouw eigen organisatie — als bunker supplier ben je zowel data-eigenaar als service provider. Zie [Bunker Diensten Toegang](bunker-diensten.md) voor een volledig ingevuld voorbeeld.

## Stap 5 — Controleer autorisatie bij een operationele aanvraag

Wanneer je eigen (niet in deze documentatie beschreven) bunkerdiensten-API een reservering ontvangt, bevraag je de AR om te controleren of er een geldige policy is. Zie [Autorisatie valideren](autorisatie.md) voor de volledige uitleg van het `explained-enforce`-endpoint.

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.
