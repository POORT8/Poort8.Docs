# PortlinQ — Referentie-implementatie (havenbezoek & walstroom)

> 🚧 **Under construction**

Referentie-implementatie van het havenbezoek- en walstroomproces in PortlinQ, met de concrete API-calls op basis van de [PortlinQ API-spec](https://portlinq-preview.poort8.nl/scalar/). Bedoeld zodat een developer de flow kan naspelen. Instance-specifieke waarden staan als `{PLACEHOLDER}` of `[TBD]` — die worden tijdens de technische configuratie ingevuld.

## Overzicht

Twee use cases, elk met een ander type poort:

1. **Visit** — het binnenvaren (en verlaten) van de haven; aankomst en vertrek worden geregistreerd. → **mét policy check** (autorisatie).
2. **Walstroom** — het afnemen van walstroom; de kast wordt aan- en uitgezet. → **zónder policy check, mét token-validatie** (authenticatie).

Wie doet mee: schipper **Ardin** op de **MS Amare**, die aanmeert bij de haven **Port of Twente**. Diensten komen van **GetSturdy** (geofence/AIS), **ShipLogic** (havenmanagement) en **Ease2pay** (walstroom); de app is **Connect4Shore**; **PortlinQ / Poort8** beheert het stelsel.

Kernkeuzes (hoog over — technische uitwerking verderop):

- Policy-issuer = de **eigenaarorganisatie van de MS Amare**; de **MS Amare** zelf is de policy-resource.
- AIS/geofence-events gaan via **push** (GetSturdy → haven).
- Diensten worden gevonden via **tags** (discovery).
- Voor policy-create en service-calls gebruikt Connect4Shore een **schip-token**; voor AR-enforcement gebruikt GetSturdy een **aparte provider-app token** (NoodleBar API-toegang).

## Flow (sequence diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Ardin as Ardin (Alice)
    participant C4S as Connect4Shore (David)
    participant PLQ as PortlinQ / NoodleBar (Emma)
    participant GS as GetSturdy (Charlie)
    participant EuRIS as EuRIS (extern)
    participant SL as ShipLogic (Charlie)
    participant E2P as Ease2pay (Charlie)

    rect rgb(235, 244, 255)
    Note over Ardin,E2P: Voorbereiding (eenmalig) — registraties, tags, ontvang-endpoint haven
    end

    Ardin->>C4S: login + selecteer MS Amare
    C4S->>PLQ: OAuth2 token (client credentials, MS Amare)
    PLQ-->>C4S: access_token
    C4S->>PLQ: GET /v1/api/systems?tag=port
    PLQ-->>C4S: havens (incl. url)
    Ardin->>C4S: selecteer Port of Twente
    C4S->>PLQ: GET /v1/api/systems?tag=visit&tag=port
    PLQ-->>C4S: aanmeer-dienst
    Ardin->>C4S: selecteer aanmeren
    C4S->>PLQ: POST /v1/api/policies (issuer=EUID_VESSEL_ORGANIZATION, resource=SCHIP_ID, subject=EUID_PORT_AUTHORITY, serviceProvider=EUID_GEOFENCE_PROVIDER)
    PLQ-->>C4S: policy aangemaakt
    C4S->>PLQ: GET /v1/api/systems?tag=shorepower&tag=port
    PLQ-->>C4S: walstroom-dienst (incl. url)
    Ardin->>C4S: selecteer Walstroom

    rect rgb(232, 245, 233)
    Note over Ardin,SL: Use case 1 — autorisatie (binnenvaren)
    Note over GS: geofence enter (gesimuleerd, D1)
    GS->>EuRIS: AIS ophalen (EuRIS-toestemming, continu — afhankelijkheid)
    EuRIS-->>GS: AIS-signaal
    GS->>PLQ: GET /v1/api/authorization/explained-enforce
    PLQ-->>GS: {allowed: true}
    GS->>SL: push enter-event (haven ontvangt) → binnenvaren registreren
    end

    rect rgb(255, 243, 224)
    Note over Ardin,E2P: Use case 2 — authenticatie (walstroom)
    Ardin->>C4S: START
    C4S->>E2P: start walstroomkast (Bearer token)
    E2P->>PLQ: token valideren
    PLQ-->>E2P: geldig
    E2P-->>C4S: OK — kast AAN
    Ardin->>C4S: STOP
    C4S->>E2P: stop walstroomkast
    E2P-->>C4S: OK — kast UIT + kWh
    end

    Note over GS: geofence exit (gesimuleerd, D2)
    GS->>SL: push exit-event (verblijfsduur vastgesteld)

    rect rgb(243, 229, 245)
    Note over C4S,E2P: Afrekening / proforma (D3 — endpoints TBD)
    C4S->>SL: havengeld voor visit ophalen
    SL-->>C4S: bedrag
    C4S->>E2P: kWh / kosten ophalen
    E2P-->>C4S: kWh + kosten
    C4S->>Ardin: proforma-overzicht
    end
```

## Technische uitgangspunten

- **Base URL:** `https://portlinq-preview.poort8.nl`
- **Auth:** deze flow gebruikt twee tokens:
  - `ACCESS_TOKEN_SHIP` voor Connect4Shore-calls namens de Amare (bijv. `systems`, `policies`, walstroom-calls)
  - `ACCESS_TOKEN_PROVIDER` voor GetSturdy-calls naar het AR (`explained-enforce`), met een aparte provider-app met toegang tot de NoodleBar API

> \* Later op te pakken (zie Openstaande werkzaamheden — Scheepsregister): als alternatief op de directe client credentials van de Amare kan token exchange via een externe IdP (RFC 8693) worden ingezet, waarbij Connect4Shore namens het schip handelt.

## Actoren en identifiers

| Partij | Persona | Rol | Identifier (placeholder) |
| -- | -- | -- | -- |
| MS Amare | Alice | Schipper / schip (deelnemer) | `<EUID_VESSEL_ORGANIZATION>` (eigenaar), `<SCHIP_ID>` (bijv. ENI) |
| Port of Twente | Bob | Haven / data rights holder | `<EUID_PORT_AUTHORITY>` |
| Ease2pay | Charlie | Walstroom | `<EUID_SHOREPOWER_PROVIDER>` |
| ShipLogic | Charlie | HMS + havengeldberekening | `<EUID_HMS_PROVIDER>` |
| GetSturdy | Charlie | Geofence / AIS-leverancier | `<EUID_GEOFENCE_PROVIDER>` |
| Connect4Shore | David | App / dienstconsument | `<EUID_APP_PROVIDER>` |
| PortlinQ / Poort8 | Emma | Dataspace-beheerder | — |

**Placeholder-conventie (technische requests):** gebruik EUID-waarden in het formaat `NLNHR.<KVK_NUMMER>`, bijvoorbeeld `NLNHR.<KVK_PORT_OF_TWENTE>`. Namen zoals "Port of Twente" zijn alleen leeshulp in de uitleg.

De geofence-policy gebruikt `<SCHIP_ID>` als `resourceId`; dit is de identifier van het schip zelf, bijvoorbeeld een ENI.

## Voorbereiding (onboarding & registratie)

Eenmalig vooraf; hierop draait de uitvoering.

**V1 — Deelnemers registreren.** MS Amare*, Port of Twente, Ease2pay, ShipLogic, GetSturdy, Connect4Shore krijgen elk een identiteit + client credentials.

> \* Zie Openstaande werkzaamheden (ENI / scheepsidentifier, NB-1609).

**V2 — Systemen publiceren + taggen.** Diensten worden als systemen geregistreerd en getagd: aanmeren/scheepsbezoek → `visit`, havendienst → `port`, walstroom → `shorepower`, vaartuig → `vessel`. Elk systeem krijgt een `url`.

**V3 — Ontvang-endpoint voor de events (push).** Omdat we voor het **push-model** kiezen (zie Overzicht → kernkeuzes), biedt de haven/ShipLogic een **ontvang-endpoint** aan waar GetSturdy het enter-/exit-event naartoe pusht, en registreert dat. GetSturdy gebruikt de schipidentifier `<SCHIP_ID>` uit het AIS-event als `resource` in de autorisatie-check.

**V4 — Havengeldtarieven** vastleggen in het HMS (ShipLogic).

## Uitvoering van de demo

### Stap 1 — Inloggen + schip selecteren
Ardin logt in bij Connect4Shore en selecteert de MS Amare. App-interne actie.

### Stap 2 — Token ophalen namens de MS Amare
Connect4Shore handelt namens de Amare. Voor nu gebruiken we de client credentials van de Amare zelf (geen scheepsregister → workaround). Token exchange via een externe IdP is een latere variant (zie de voetnoot bij Auth en Openstaande werkzaamheden).

```http
POST https://auth.poort8.nl/realms/portlinq-preview/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=<CLIENT_ID_AMARE>
&client_secret=<CLIENT_SECRET_AMARE>
&scope=noodlebar-api
```

Response: `ACCESS_TOKEN_SHIP` (JWT). Deze gaat mee als `Authorization: Bearer` in de calls van Connect4Shore.

### Stap 3 — Havens ophalen
```http
GET https://portlinq-preview.poort8.nl/v1/api/systems?tag=port
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
Response: systemen getagd als `port`, elk met `organizationName` en `url`.

### Stap 4 — Haven selecteren
Ardin selecteert Port of Twente. App-interne selectie op basis van stap 3.

### Stap 5 — Aanmeren selecteren + policy inschieten
Ardin selecteert de aanmeer-/bezoekdienst van de haven (tag `visit`). Bij die selectie schiet de app de **policy** in: de MS Amare geeft Port of Twente toestemming om straks het arrival/departure-event (gedetecteerd door GetSturdy via AIS, gepusht naar de haven) te ontvangen. Issuer = de Amare (Ardin handelt via de app namens het schip).

```http
GET https://portlinq-preview.poort8.nl/v1/api/systems?tag=visit&tag=port
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
```http
POST https://portlinq-preview.poort8.nl/v1/api/policies
Authorization: Bearer <ACCESS_TOKEN_SHIP>
Content-Type: application/json

{
  "useCase": "portlinq",
  "issuerId": "<EUID_VESSEL_ORGANIZATION>",
  "subjectId": "<EUID_PORT_AUTHORITY>",
  "serviceProvider": "<EUID_GEOFENCE_PROVIDER>",
  "type": "geo-fence",
  "action": "monitor",
  "resourceId": "<SCHIP_ID>",
  "attribute": "*",
  "expiration": <UNIX_TIMESTAMP>
}
```

### Stap 6 — Walstroom selecteren
Als het schip in de buurt is, selecteert Ardin de walstroom-dienst.

```http
GET https://portlinq-preview.poort8.nl/v1/api/systems?tag=shorepower&tag=port
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
Response: walstroom-dienst(en) van de haven, met de `url` van Ease2pay om aan te roepen.

### Stap 7 — Binnenvaren: autorisatie (use case 1)
Geofence enter-event (gesimuleerd, D1). GetSturdy volgt de Amare (AIS is beschikbaar via de EuRIS-toestemming — zie afhankelijkheden) en controleert bij PortlinQ of de haven het binnenvaren mag ontvangen:

```http
GET https://portlinq-preview.poort8.nl/v1/api/authorization/explained-enforce
  ?issuer=<EUID_VESSEL_ORGANIZATION>
  &subject=<EUID_PORT_AUTHORITY>
  &serviceProvider=<EUID_GEOFENCE_PROVIDER>
  &resource=<SCHIP_ID>
  &type=geo-fence
  &action=monitor
  &attribute=*
  &useCase=portlinq
Authorization: Bearer <ACCESS_TOKEN_PROVIDER>
```
Response: HTTP `200` met `allowed: true` (de policy uit stap 5 matcht). Bij `allowed: true` **pusht** GetSturdy het enter-event naar het ontvang-endpoint van de haven/ShipLogic; ShipLogic registreert het binnenvaren voor de visit.

> **Tegenscenario (autorisatie):** ontbreekt de policy, dan geeft `explained-enforce` `allowed: false` → GetSturdy pusht niet en het binnenvaren wordt niet geregistreerd.

### Stap 8 — Walstroom AAN (START): authenticatie (use case 2)
Ardin drukt START. Connect4Shore roept het walstroom-endpoint van Ease2pay aan (URL uit stap 6), met het Bearer-token:

```http
POST {EASE2PAY_WALSTROOM_URL}/start        # url uit systems-response
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
Ease2pay valideert het token (is dit een vertrouwde deelnemer?) → kast AAN, `200 OK`. **Geen policy/enforce — dit is puur authenticatie.**

> **Tegenscenario (authenticatie):** een onbekende/niet-vertrouwde partij heeft geen geldig token → `401/403` → kast blijft uit.

### Stap 9 — Walstroom UIT (STOP)
```http
POST {EASE2PAY_WALSTROOM_URL}/stop
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
Kast UIT, `200 OK` + afgenomen kWh.

### Stap 10 — Vertrek: geofence exit
Geofence exit-event (gesimuleerd, D2). GetSturdy detecteert vertrek en stopt met volgen; ShipLogic legt de eindtijd vast → verblijfsduur (enter + exit) definitief.

### Stap 11 — Afrekening / proforma
Connect4Shore stelt het overzicht samen uit twee bronnen. **Deze endpoints moeten nog gebouwd worden (D3).**

```http
GET {SHIPLOGIC_URL}/visits/{visitId}/havengeld     # [TBD] — havengeld o.b.v. timestamps + tarieven
GET {EASE2PAY_URL}/sessions/{sessionId}/kosten      # [TBD] — kWh + kosten
Authorization: Bearer <ACCESS_TOKEN_SHIP>
```
Connect4Shore toont de proforma aan Ardin.

## Afhankelijkheden

- **EuRIS-toestemming (buiten PortlinQ).** Bij EuRIS is vastgelegd dat de AIS-data van zes schepen (incl. de Amare) continu opgehaald mag worden; GetSturdy haalt die op als AIS-leverancier namens PortlinQ. Dit leeft in het EuRIS-register, niet in PortlinQ — randvoorwaarde voor stap 7.
- **D1 — Simulatie binnenvaren** (geofence enter-event) zodat use case 1 live getoond kan worden.
- **D2 — Simulatie vertrek** (geofence exit-event).
- **D3 — Kosten-endpoints** nog te leveren door ShipLogic (havengeld) en Ease2pay (kWh/kosten).

> Gemaakte keuze: de policy wordt dynamisch ingeschoten bij het selecteren van de aanmeer-dienst (stap 5), met de MS Amare als issuer.

## Openstaande werkzaamheden

1. **Scheepsregister — Out of scope.** Er is (nog) geen scheepsregister. In deze opzet gebruikt de app tijdelijk de client credentials van de MS Amare en handelt daarmee "als de Amare". De nette variant — de app die namens het schip handelt via delegatie / token exchange (RFC 8693) in plaats van geleende credentials — hoort bij een echt scheepsregister en valt buiten de scope van deze implementatie.
2. **NAW-gegevens** — organisatie-endpoint dat NAW-gegevens teruggeeft (NB-1608).
3. **ENI / scheepsidentifier** — inschatting om ENI als identifier toe te voegen bij inschrijving van het schip (NB-1609).
4. **Organisatielijst (leden) API** — endpoint om in één keer alle ingeschreven leden op te halen (NB-1671).

## Referenties

- PortlinQ API (Scalar): `https://portlinq-preview.poort8.nl/scalar/v1`
