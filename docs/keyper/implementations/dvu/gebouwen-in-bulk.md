---
title: "DVU - meerdere gebouwen toevoegen"
nav_order: 20
parent: "DVU"
grand_parent: "Implementations"
layout: default
---

# DVU Implementatie: meerdere gebouwen toevoegen vanuit externe datadienst

## Implementatie-instructie Keyper Approve voor DVU diensten: Toestemming voor Energiedata van meerdere gebouwen via DVU

### Doel

Gebruikers van een applicatie moeten toestemming vragen aan de energiecontractant om energiedata op te halen.

---

### Stap 1: Formulier op de website

Voor bulk gebouwen toevoegen heeft EED een uitgebreid formulier nodig voor het verzamelen van meerdere gebouwadressen.

#### Velden aanvrager (invullend persoon)

- E-mailadres
- Organisatie
- Organisatie-id (EORI, voorbeeld: EU.EORI.NL860730499)

#### Velden energiecontractant (approver via Keyper Approve)

- E-mailadres
- Organisatie
- Organisatie-id (EORI, voorbeeld: EU.EORI.NL860730499)

#### Velden gebouwen (bulk invoer)

- **Adreslijst**: Meerdere adressen kunnen worden toegevoegd
  - Per adres: Postcode + Huisnummer (bijv. "3013 AK 45")

**Validatie vereist**: E-mail, EORI-nummer, en minimaal één geldig adres. Client-side validatie wordt sterk aanbevolen voor gebruikerservaring.

---

### Stap 2: Aanroepen van de Keyper API

[https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)

Bij formulierverzending stuur je een POST-verzoek naar:

```
POST https://keyper-preview.poort8.nl/api/approval-links
Content-Type: application/json
```

#### JSON-body voorbeeld voor DVU bulk gebouwen op basis van formulierinvoer

```json
{
  "authenticationMethods": ["eherkenning"],
  "requester": {
    "email": "<EMAIL_AANVRAGER>",
    "organization": "<ORGANISATIE_AANVRAGER>",
    "organizationId": "<EORI_AANVRAGER>"
  },
  "approver": {
    "email": "<EMAIL_ENERGIECONTRACTANT>",
    "organization": "<ORGANISATIE_ENERGIECONTRACTANT>",
    "organizationId": "<EORI_ENERGIECONTRACTANT>"
  },
  "dataspace": {
    "name": "dvu",
    "policyUrl": "https://dvu-test.azurewebsites.net/api/policies/",
    "organizationUrl": "https://dvu-test.azurewebsites.net/api/organization-registry/__ORGANIZATIONID__",
    "resourceGroupUrl": "https://dvu-test.azurewebsites.net/api/resourcegroups/"
  },
  "description": "Keyper approve link voor bulk gebouwen - EED",
  "reference": "<EIGEN_REF>",
  "expiresInSeconds": "<GELDIGHEID>",
  "redirectUrl": "<VERWIJS_URL_EINDE_FLOW>",
  "orchestration": {
    "flow": "dvu.voeg-gebouwen-toe@1",
    "payload": {
      "addresses": ["3013 AK 45", "3161 GD 7a", "3161 GD 7b"]
    }
  }
}
```

**Belangrijke orchestration configuratie**:
- **`flow`**: `"dvu.voeg-gebouwen-toe@1"` activeert de bulk gebouwen metadata flow
- **`payload.addresses`**: Array van adressen in formaat "postcode huisnummer"
- **Automatische redirect**: Keyper detecteert de flow en leidt gebruikers automatisch naar DVU metadata-app

**Verwacht gedrag**:
1. Na aanmaken krijgt EED een approval link terug met status "Active"
2. Wanneer de approver de link opent, wordt deze automatisch doorgeleid naar DVU metadata-app
3. In de DVU app kan de approver de bulk gebouwen toevoegen met aanvullende gegevens
4. Na voltooien keert de gebruiker terug naar Keyper Approve voor finale goedkeuring

- Gebruik URL encoding voor het adres in `redirectUrl`.
- Het respons-object bevat een veld “status”. Als deze “Active” is, dan is de link succesvol aangemaakt. De approver wordt  automatisch per email om reactie verzocht.
- Kies een geldigheid (in seconden) voor hoe lang de link actief is, bijvoorbeeld 1 week (604.800 seconden).
- Gebruik een referentie voor gebruik in de app.

## Stap 3: VBO en EAN gegevens ophalen via DVU API

Na de goedkeuring via Keyper Approve kunnen developers de VBO-identifiers en bijbehorende EAN-codes ophalen via de DVU API. Dit gebeurt in het laatste deel van onderstaand sequence diagram: `eLoket->AR: ophalen vboIds + EANs`.

### Authenticatie: iSHARE Access Token Verkrijgen

Alle DVU API calls vereisen een geldig iSHARE access token. Dit verkrijg je in twee stappen:

#### Stap 1: Genereer Client Assertion JWT

Voor iSHARE authenticatie heb je een client assertion JWT nodig. Deze bevat je organisatie-gegevens en is ondertekend met je private key en moet een x5c header bevatten met je certificaat chain.

**Vereiste JWT Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT", 
  "x5c": ["MIIEfzCCAmegAwIBAgII..."]  // Jouw certificaat chain (base64)
}
```

**Vereiste JWT Claims:**
```json
{
  "iss": "EU.EORI.NL123456789",           // Jouw EORI nummer (Party Identifier)
  "sub": "EU.EORI.NL123456789",           // Zelfde als iss  
  "aud": "EU.EORI.NL822555025",           // DVU EORI
  "iat": 1750665132,                      // Unix timestamp (nu)
  "exp": 1750665162,                      // Unix timestamp (30 seconden later)
  "jti": "378a47c4-2822-4ca5-a49a-7e5a1cc7ea59"  // Unieke UUID voor deze JWT
}
```

**Implementatie Hulpmiddelen:**
- **Voor .NET developers**: Gebruik het [Poort8.iSHARE.Core NuGet package](https://github.com/POORT8/Poort8.Ishare.Core/blob/master/README.md) voor eenvoudige JWT generatie.
- **Voor Python developers**: Zie [iSHARE Python code snippets](https://github.com/iSHAREScheme/code-snippets/blob/master/Python/access_token.py) voor complete implementatie.
- **Voor andere platforms**: Volg de [iSHARE Client Assertion specificatie](https://dev.ishare.eu/reference/ishare-jwt/client-assertion) voor JWT creation.

#### Stap 2: Verkrijg Access Token

```http
POST https://dvu-test.azurewebsites.net/iSHARE/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=EU.EORI.NL123456789&client_assertion=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### VBO en EAN Data Ophalen

Met je access token kun je nu VBO en EAN gegevens ophalen via de Resource Groups API:

```http
GET https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=EU.EORI.NL123456789
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci...
```

#### Query Parameters

| Parameter | Type | Verplicht | Beschrijving |
|-----------|------|-----------|--------------|
| `issuer` | string | Ja | Jouw EORI nummer (zelfde als in client assertion) |
| `vbo` | string | Nee* | Filter op specifiek VBO ID |
| `ean` | string | Nee* | Filter op specifiek EAN ID |

*Tenminste één van `vbo` of `ean` moet worden opgegeven als je wilt filteren

#### Response Format

**Success Response (200 OK):**
```json
{
  "resourceGroupId": "dvu:resource:871689260010498601",
  "useCase": "DVU",
  "name": "871689260010498601",
  "description": "Verblijfsobject",
  "resources": [
    {
      "resourceId": "dvu:resource:0613010000206776",
      "useCase": "DVU",
      "name": "0613010000206776",
      "description": "EAN"
    },
    {
      "resourceId": "dvu:resource:0613010000206776", 
      "useCase": "DVU",
      "name": "0613010000206776",
      "description": "EAN"
    }
  ]
}
```

#### Error Responses

**401 Unauthorized** - Geen geldig token:
```json
{
  "error": "Unauthorized",
  "message": "No valid bearer token provided"
}
```

**403 Forbidden** - Token clientId komt niet overeen met issuer:
```json
{
  "error": "Forbidden", 
  "message": "Token clientId does not match requested issuer"
}
```

**404 Not Found** - Geen resources gevonden:
```json
{
  "error": "Not Found",
  "message": "No resources found for the specified criteria"
}
```

### Complete API Voorbeelden

#### Voorbeeld 1: Alle VBOs en EANs voor een organisatie ophalen

```bash
# Verkrijg access token
curl -X POST "https://dvu-test.azurewebsites.net/iSHARE/connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=iSHARE&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=EU.EORI.NL123456789&client_assertion=eyJ0eXAiOiJKV1QiLCJhbGci..."

# Haal alle resources op voor organisatie
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

#### Voorbeeld 2: Specifiek VBO met alle bijbehorende EANs

```bash
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?vbo=0613010000206776&issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

#### Voorbeeld 3: VBO opzoeken via EAN

```bash
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?ean=871689260010498595&issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

**Response:** Retourneert het VBO waarin deze EAN zich bevindt, inclusief alle andere EANs in dat VBO.

#### Voorbeeld 4: Specifieke combinatie VBO + EAN

```bash
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?vbo=0613010000206776&ean=871689260010498595&issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

**Response:** Retourneert het opgegeven VBO, maar filtert de resources naar alleen de opgegeven EAN.

### Belangrijke Opmerkingen

- **Token geldigheid**: Access tokens zijn 1 uur geldig (`expires_in: 3600`)
- **Rate limiting**: Respecteer eventuele rate limits van de API
- **EORI validatie**: Het `issuer` parameter moet exact overeenkomen met de `clientId` in je access token
- **Client assertion**: Gebruik een nieuwe `jti` (JWT ID) voor elke client assertion om replay attacks te voorkomen

## Sequence diagram toegang aanvragen tot gebouwen in bulk

De onderstaande sequence toont het DVU goedkeuringsproces voor meerdere gebouwen tegelijk.

```plantuml
entryspacing 0.7
frame #ddf2ff  DVU

fontawesome5solid f007 "Gebouwbeheerder\nen energiecontractant" as GE #512a19
fontawesome5solid f5b0 "dataservice-gebruiker" as DG #005a9c
fontawesome5solid f13d "Keyper Approve" as KA #3bba9c
fontawesome5solid f0ac "DVU Metadata-app" as MetadataApp #ffd580
fontawesome5solid f6a1 "DVU Satelliet" as DVUSat #ffa98a
fontawesome5solid f3ed "Autorisatieregister" as AR #5182d8
fontawesome5solid f2c1 "eHerkenning" as Eherkenning #592874
fontawesome5solid f1c0 "dataservice-aanbieder" as DA #888888
fontawesome5solid f0d1 RNB #dddddd

== Gebouwen toevoegen via DG == #ddf2ff
activate GE
GE->DG: start sessie
activate DG
GE->DG: invoeren gebouwen (adres/vboId)
DG->DG: verzamelen gebouwdata
DG->KA: aanmaken transactielink
activate KA
KA->KA: valideren input
KA->DG: status: Active + redirect URL
deactivate KA
DG->GE: redirect naar Keyper Approve
deactivate DG


== Bulk-gebouwgegevens aanvullen (tijdelijk totdat CAR aansluiting in gebruik is)== #ddf2ff

GE->KA: openen redirect URL
activate KA
KA->GE: redirect naar MetadataApp (gebouw toevoegen in bulk)
deactivate KA
GE->MetadataApp: invullen aanvullende gegevens
activate MetadataApp
GE->MetadataApp: doorlopen flow
MetadataApp->GE: terug naar Keyper Approve
deactivate MetadataApp

== Transacties bevestigen == #ddf2ff
GE->KA: controleer transacties
activate KA
note over KA: (optioneel) registratie \noverheidsorganisatie\nals DVU-deelnemer
note over KA: toestemming ophalen\nenergiedata voor DG:\nper gebouw geregistreerd\n(later: bulktoestemming)

KA->GE: overzicht transacties
GE->Eherkenning: inloggen eHerkenning niveau 3
activate Eherkenning
Eherkenning->KA: identity token
deactivate Eherkenning
KA->DVUSat: registreer inschrijving
activate DVUSat
DVUSat-->KA: bevestiging
deactivate DVUSat

KA->AR: registreer metadata & toestemmingen
activate AR
AR-->KA: bevestiging
KA-->RNB: afgeven/hergebruiken toestemmingen onder GUE
deactivate AR
KA->GE: redirect naar DG
deactivate GE
KA->DG: notificatie: autorisaties verwerkt
deactivate KA


== Data ophalen via DVU koppelingen == #ddf2ff
activate DG
DG->AR: ophalen vboIds + EANs (digikoppeling)
activate AR
AR-->DG: identifiers
deactivate AR
DG->DA: ophalen energiedata
deactivate DG
```
