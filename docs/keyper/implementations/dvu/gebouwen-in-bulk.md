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
