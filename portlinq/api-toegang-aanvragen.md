# API-toegang aanvragen

Deze gids is voor **David** — een data service consumer die API's wil aanroepen die in de PortlinQ-dataspace zijn geregistreerd. Hij beschrijft het volledige proces van het registreren van je applicatie tot het maken van API-calls.

## Voorwaarden

| Voorwaarde | Beschrijving |
|------------|--------------|
| Organisatie geregistreerd | Je organisatie is geregistreerd en goedgekeurd in PortlinQ — zie [Organisatie Registratie](onboarding.md) |
| Account actief | Je hebt een actief account op het [Self-Service Portal](https://portlinq-preview.poort8.nl/portal) |
| Doel-API bekend | Je weet met welke API je wilt integreren |

## Stap 1 — Registreer je applicatie

1. Log in op het [Self-Service Portal](https://portlinq-preview.poort8.nl/portal)
2. Ga naar **Systems** → **Register Application**
3. Vul de applicatiegegevens in (naam, beschrijving)
4. Dien de registratie in

Na registratie toont het portal je **client credentials**:

| Credential | Beschrijving |
|------------|--------------|
| `client_id` | Unieke identifier van je applicatie |
| `client_secret` | De secret van je applicatie — **bewaar veilig** |

> ⚠️ **Belangrijk:** de client secret wordt maar één keer getoond. Kopieer en bewaar 'm veilig. Ben je 'm kwijt, dan moet je een nieuwe genereren.

## Stap 2 — Vraag API-toegang aan

1. Ga naar de **Catalogus** in het Self-Service Portal
2. Blader of zoek naar de API waarmee je wilt integreren
3. Bekijk de API-documentatie (OpenAPI-spec) om de beschikbare endpoints te begrijpen
4. Klik op **Request Access**

Je aanvraag heeft nu status **Pending**. De API-eigenaar (Charlie) wordt genotificeerd en keurt goed of af.

## Stap 3 — Vraag een access token aan

Nadat je toegangsaanvraag is goedgekeurd, gebruik je de **OAuth Client Credentials**-grant om een access token op te halen.

```bash
curl -X POST https://auth.poort8.nl/realms/portlinq-preview/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=TARGET_API_CLIENT_ID"
```

| Parameter | Waarde | Beschrijving |
|-----------|--------|--------------|
| `grant_type` | `client_credentials` | Altijd deze waarde voor M2M-authenticatie |
| `client_id` | Je applicatie-client-ID | Getoond in het portal na registratie |
| `client_secret` | Je applicatie-client-secret | Getoond in het portal na registratie |
| `scope` | De client ID van de doel-API | Te vinden in de catalogus in het portal |

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "target-api-client-id organization"
}
```

> ⏱️ **Token-lifetime:** access tokens zijn kortlevend. Vraag een nieuw token aan voordat het huidige verloopt; cache tokens niet langer dan hun geldigheid.

## Stap 4 — Roep de API aan

Neem het access token op als Bearer token in de `Authorization`-header:

```bash
curl https://api.voorbeeld-provider.nl/data \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

De provider valideert je token en controleert of je organisatie geautoriseerd is. Zie [Tokens valideren](access-tokens-valideren.md) en [Autorisatie valideren](autorisatie.md) voor hoe providers dit doen.

## Toegang op dataniveau (Keyper)

API-toegang geeft je het recht om de API aan te roepen. Voor toegang tot specifieke **data** kan daarnaast een policy op dataniveau nodig zijn, die de data-rechthebbende (Bob) goedkeurt. In de generieke dataspace verloopt dat via **Keyper Approval Links**.

> ℹ️ Keyper is in PortlinQ nog niet als onderdeel van deze dataspace ingericht. Zie de [generieke Keyper-documentatie ➚](../keyper/) voor hoe approval-links werken.

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.