# Geofence Arrival & Departure Flow

Haven autoriteiten kunnen automatisch aankomst- en vertrekmeldingen ontvangen wanneer schepen hun haven zone binnenkomen of verlaten. Deze flow beschrijft hoe geofence services schip locaties monitoren en arrival/departure events genereren met PortlinQ autorisatie.

🔗 **[API Docs ➚](https://portlinq-preview.poort8.nl/scalar/v1)** — Interactieve endpoint testing

## Overzicht

De geofence arrival flow is een **automatische, consent-gebaseerde** service waarbij een geofence provider (Charlie) schip bewegingen detecteert via AIS/EuRIS en arrival/departure events naar haven autoriteiten (Bob) stuurt. De schipper app maakt vooraf een geofence consent policy aan namens het schip via de [Authenticatie Flow](authenticatie.md). Tijdens runtime verifieert Charlie autorisaties via PortlinQ AR voordat events worden verstuurd—volledig machine-to-machine zonder schipper betrokkenheid.

> **Belangrijk:** Deze flow toont hoe PortlinQ consent-based automation ondersteunt zonder actieve schipper betrokkenheid bij elke haven aanmelding.

## Sequence Diagram

### Setup: Policy Registratie (vooraf)

```mermaid
sequenceDiagram
    actor Alice as Alice (Schipper)
    participant David as David (Schippers APP)
    participant AR as PortlinQ-AR
    Note over Alice,AR: Prerequisites: Exploitant heeft Schip (ENI)<br/>geregistreerd in ASR met relaties.

    rect rgb(230, 240, 255)
        Note over Alice,David: Authenticatie Flow
        Note over Alice,David: Resulteert in schip-scoped token
    end

    David->>AR: 1. Create geofence consent policy namens schip<br/>(schip → Charlie → geofence monitoring)
    AR-->>David: Policy created
    David-->>Alice: Consent geregistreerd
```

### Runtime: Automatische Arrival/Departure Events (machine-to-machine)

```mermaid
sequenceDiagram
    participant Charlie as Charlie (Geofence Service)
    participant ASR as PortlinQ-ASR
    participant AR as PortlinQ-AR
    participant Bob as Bob (Port Authority)
    Note over Charlie,Bob: Runtime prerequisites:<br/>Schip consent policy exists in AR.<br/>Port contract (optioneel) geregistreerd in AR.


    rect rgb(230, 240, 255)
        Note over Charlie,ASR: Authenticatie Flow
        Note over Charlie,ASR: Resulteert in schip-scoped token
    end

    %% Ship detected
    Note left of Charlie: AIS/EuRIS: ENI detected<br/>entering port zone
    
    %% Authorization checks
    Charlie->>AR: 3. Check schipper consent<br/>(issuer=ship, subject=Charlie,<br/>resource=geofence)
    Note right of AR: Evaluate schipper's<br/>consent policy
    AR-->>Charlie: Permit
    rect rgb(240, 240, 240)
        Note over Charlie,AR: Optioneel
        Charlie->>AR: 4. Check port contract<br/>(issuer=Bob, subject=Exploitant,<br/>resource=port-services)
        Note right of AR: Evaluate Bob's<br/>contract policy
        AR-->>Charlie: Permit
    end

    %% Arrival event
    Charlie->>Bob: 5. Arrival event<br/>(ENI, timestamp, zone, exploitant)
    Bob-->>Charlie: Ack

    %% Departure
    Note left of Charlie: ...time passes...<br/>ENI detected leaving port zone
    Charlie->>AR: 6. Re-verify consent + contract
    AR-->>Charlie: Permit
    Charlie->>Bob: 7. Departure event<br/>(ENI, timestamp, zone, exploitant)
    Bob-->>Charlie: Ack

    %% Invoicing
    Note right of Bob: Calculate duration<br/>→ Invoice exploitant
```

## Voorwaarden (Prerequisites)

Deze stappen worden uitgevoerd vooraf door verschillende partijen:

| Prerequisite | Wat | Wie |
|--------------|-----|-----|
| **Schip registratie** | Schip (ENI) + exploitant relatie geregistreerd in ASR | Exploitant |
| **Schipper consent** | Geofence consent policy aangemaakt via [Authenticatie Flow](authenticatie.md) | Schipper (via app) |
| **Port contract** (optioneel) | Haven autoriteit heeft contract geregistreerd met exploitant in AR | Haven |

## Stappen

### Setup: Policy Registratie (vooraf)

#### Authenticatie & Schip Token

Zie [Authenticatie Flow](authenticatie.md) voor de volledige authenticatie stappen. De schipper selecteert het schip, en de app verkrijgt een schip-scoped token via ASR token exchange.

#### Policy Aanmaak: Geofence Consent _(PortlinQ AR)_

De schipper app maakt namens het schip een geofence consent policy aan die Charlie (geofence service) toestemming geeft om geofence monitoring uit te voeren. Zie [Consent Management](#consent-management) sectie voor API details.

### Runtime: Automatische Events (machine-to-machine)

#### Schip detectie _(extern)_

Charlie's geofence service ontvangt AIS of EuRIS locatie data en detecteert dat een schip (ENI) een haven geofence zone binnenkomt.

> ℹ️ AIS/EuRIS locatie data integratie valt buiten PortlinQ scope. Charlie moet deze data via officiële kanalen verkrijgen.

#### Participant verificatie _(PortlinQ Organization Registry)_

Charlie verifieert dat het gedetecteerde schip (ENI) een geregistreerde participant is in PortlinQ via het Organization Registry.

```http
GET https://portlinq-preview.poort8.nl/api/organization-registry/{ENI}
Authorization: Bearer {charlie_service_token}
```

Zie de [Organization Registry API docs ➚](https://portlinq-preview.poort8.nl/scalar/#tag/organization-registry/GET/api/organization-registry/{id}) voor de volledige response specificatie.

Als de participant niet gevonden wordt, stopt Charlie de flow (geen event verzonden).

#### Schipper consent verificatie _(PortlinQ AR)_

Charlie controleert via AR of de schipper consent heeft gegeven voor geofence monitoring.

```http
GET https://portlinq-preview.poort8.nl/api/authorization/explained-enforce
  ?subject={havenbedrijf_id}
  &resource=*
  &action=monitor
  &issuer={schipper_organization_id}
  &serviceProvider={Charlie_organization_id}
  &type=geo-fence
  &attribute={haven_locatie_id}
Authorization: Bearer {charlie_service_token}
```

**AR evaluatie:**
1. AR zoekt naar consent policy waar:
   - `issuer` = Schipper organisatie — de schipper heeft deze policy aangemaakt
   - `subject` = Havenbedrijf
   - `resource` = * (alle resources)
   - `action` = monitor
   - `attribute` = Specifieke haven locatie
2. Als een geldige consent policy bestaat → `Permit`
3. Anders → `Deny`

**Response (Permit):**

```json
{
  "allowed": true,
  "explainPolicies": [
    {
      "policyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "issuerId": "{schipper_organization_id}",
      "subjectId": "{havenbedrijf_id}",
      "resourceId": "*",
      "action": "monitor",
      "useCase": "portlinq-geofence",
      "issuedAt": 1738368000,
      "notBefore": 1738368000,
      "expiration": 1769904000,
      "serviceProvider": null,
      "type": "geo-fence",
      "attribute": "{haven_locatie_id}",
      "license": null,
      "rules": null,
      "properties": []
    }
  ]
}
```

**Response (Deny):**

```json
{
  "allowed": false,
  "explainPolicies": []
}
```

Als `allowed` = `false`, stopt Charlie de flow (geen event verzonden).

#### Port contract verificatie (optioneel) _(PortlinQ AR)_

Charlie controleert via AR of de exploitant een contract heeft met de haven autoriteit voor invoicing van het schip.

```http
GET https://portlinq-preview.poort8.nl/api/authorization/explained-enforce
  ?subject={havenbedrijf_id}
  &resource={ENI}
  &action=invoicing
  &issuer={Exploitant_KvK}
  &serviceProvider={havenbedrijf_id}
  &type=port-contract
  &attribute=*
Authorization: Bearer {charlie_service_token}
```

**AR evaluatie:**
1. AR zoekt naar port contract policy waar:
   - `issuer` = Exploitant (scheepvaart bedrijf)
   - `subject` = Havenbedrijf (Bob)
   - `resource` = Schip (ENI)
   - `action` = invoicing
2. Als een geldig contract bestaat → `Permit`
3. Anders → `Deny`

**Response (Permit):**

```json
{
  "allowed": true,
  "explainPolicies": [
    {
      "policyId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "issuerId": "{Exploitant_KvK}",
      "subjectId": "{havenbedrijf_id}",
      "resourceId": "{ENI}",
      "action": "invoicing",
      "useCase": "portlinq-port-contract",
      "issuedAt": 1738368000,
      "notBefore": 1738368000,
      "expiration": 1798732800,
      "serviceProvider": "{havenbedrijf_id}",
      "type": "port-contract",
      "attribute": "*",
      "license": null,
      "rules": null,
      "properties": []
    }
  ]
}
```

**Response (Deny):**

```json
{
  "allowed": false,
  "explainPolicies": []
}
```

Als `allowed` = `false`, stopt Charlie de flow (exploitant heeft geen contract met deze haven).

#### Arrival event verzenden _(extern)_

Als beide autorisaties succesvol zijn, stuurt Charlie een arrival event naar Bob's port authority system met schip identificatie (ENI), exploitant informatie, timestamp en haven zone.

> ℹ️ De port authority API endpoints en event formaten zijn haven-specifiek en vallen buiten de PortlinQ scope.

Bob's systeem registreert de aankomst en start een port sessie voor facturering.

#### Departure event _(PortlinQ AR + extern)_

Wanneer Charlie detecteert dat het schip de haven zone verlaat, herhaalt Charlie de autorisatie checks en stuurt een departure event naar Bob met schip identificatie, exploitant informatie, timestamp en referentie naar het arrival event.

> ℹ️ De port authority API endpoints en event formaten zijn haven-specifiek en vallen buiten de PortlinQ scope.

Bob's systeem sluit de port sessie, berekent de duration en genereert een factuur voor de exploitant.

## Foutafhandeling

**Verwachte scenario's:**

- **Participant niet gevonden**: Charlie stopt de flow; schip niet geregistreerd in PortlinQ
- **Exploitant niet gevonden**: Charlie stopt de flow; schip heeft geen exploitant relatie
- **Schipper consent ontbreekt**: AR retourneert `Deny`; Charlie stuurt geen event
- **Port contract ontbreekt**: AR retourneert `Deny`; exploitant heeft geen contract met deze haven
- **Policy verlopen**: AR retourneert `Deny`; schipper of haven moet policy verlengen
- **Port authority onbereikbaar**: Charlie retries met exponential backoff en logt failure

## Consent Management

### Schipper geofence consent

De schipper geeft consent voor geofence monitoring door een policy aan te maken in AR:

```http
POST https://portlinq-preview.poort8.nl/api/policies
Authorization: Bearer {schipper_auth_token}
Content-Type: application/json
```
```json
{
  "subjectId": "{havenbedrijf_id}",
  "action": "monitor",
  "resourceId": "*",
  "issuerId": "{schipper_organization_id}",
  "issuedAt": 1738368000,
  "notBefore": 1738368000,
  "expiration": 1769904000,
  "serviceProvider": "{Charlie_organization_id}",
  "type": "geo-fence",
  "attribute": "{haven_locatie_id}"
}
```

**Response:**

```json
{
  "policyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "issuerId": "{schipper_organization_id}",
  "subjectId": "{havenbedrijf_id}",
  "resourceId": "*",
  "action": "monitor",
  "useCase": "portlinq-geofence",
  "issuedAt": 1738368000,
  "notBefore": 1738368000,
  "expiration": 1769904000,
  "serviceProvider": "{Charlie_organization_id}",
  "type": "geo-fence",
  "attribute": "{haven_locatie_id}",
  "license": null,
  "rules": null,
  "properties": []
}
```

Deze policy kan via een schipper portal of app interface worden aangemaakt.

### Haven port contract

De exploitant registreert een contract waarmee het havenbedrijf mag factureren voor het schip:

```http
POST https://portlinq-preview.poort8.nl/api/policies
Authorization: Bearer {exploitant_auth_token}
Content-Type: application/json
```
```json
{
  "subjectId": "{havenbedrijf_id}",
  "action": "invoicing",
  "resourceId": "{ENI}",
  "issuerId": "{Exploitant_KvK}",
  "issuedAt": 1738368000,
  "notBefore": 1738368000,
  "expiration": 1798732800,
  "serviceProvider": "{havenbedrijf_id}",
  "type": "port-contract",
  "attribute": "*"
}
```

**Response:**

```json
{
  "policyId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "issuerId": "{Exploitant_KvK}",
  "subjectId": "{havenbedrijf_id}",
  "resourceId": "{ENI}",
  "action": "invoicing",
  "useCase": "portlinq-port-contract",
  "issuedAt": 1738368000,
  "notBefore": 1738368000,
  "expiration": 1798732800,
  "serviceProvider": "{havenbedrijf_id}",
  "type": "port-contract",
  "attribute": "*",
  "license": null,
  "rules": null,
  "properties": []
}
```

## Productie-omgeving

[TBD — Eventuele verschillen tussen preview en productie worden hier gedocumenteerd zodra de productie-omgeving beschikbaar is.]

**Verwacht:**

- Preview: `https://portlinq-preview.poort8.nl` (huidige pilot fase)
- Productie: `https://portlinq.poort8.nl` (na succesvolle pilot validatie)

## Volgende stappen

- Terug naar de [Introductie](README.md) voor een overzicht
- Bekijk de [PortlinQ API docs ➚](https://portlinq-preview.poort8.nl/scalar/v1) voor endpoint details
- Bekijk de [Walstroom Toegangsflow](walstroom-toegang.md) voor schipper-initiated services
- Zie de [NoodleBar documentatie](../noodlebar/) voor achtergrond over Authorization Registry

## Context: Automatische Haven Diensten

De geofence arrival flow is een voorbeeld van hoe PortlinQ automatische, consent-based diensten mogelijk maakt:

- **Schippers** geven eenmalig consent voor monitoring (geen handmatige aanmeldingen)
- **Havens** ontvangen automatisch arrival/departure events met exploitant context
- **Geofence providers** vertrouwen op PortlinQ's autorisatie infrastructuur
- **Exploitanten** ontvangen facturen op basis van werkelijke haven tijd
- **Privacy** blijft behouden: alleen events worden gedeeld, geen ruwe locatie data

Deze architectuur is herbruikbaar voor andere automatische diensten zoals dynamische vaarweg toegang en slot reserveringen.
