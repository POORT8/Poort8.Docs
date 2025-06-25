# DVU Implementation Context

DVU (Datastelsel Verduurzaming Utiliteit) provides secure access to energy data for buildings through the Keyper approval workflow.

## Overview

This section documents the DVU implementation patterns using Keyper Approve for energy data access requests. DVU enables secure, auditable access to building energy data through standardized approval workflows.

## Implementation Guides

- [Single Building Access](single-building.md) - Request energy data access for individual buildings
- [Bulk Building Access](bulk-buildings.md) - Request energy data access for multiple buildings simultaneously

## Process Flow

The DVU approval process follows a structured workflow for energy data access:

1. **Data Request**: Users submit requests through DVU applications
2. **Keyper Approval**: Requests are processed through Keyper Approve workflow  
3. **Authorization**: Energy contractors approve data sharing permissions
4. **Data Access**: Authorized applications can access energy data

## Architecture

DVU integrates with several key components:

- **Keyper Approve**: Handles approval workflows and consent management
- **DVU Metadata App**: Manages building metadata and registration
- **DVU Satellite**: Core DVU infrastructure for data processing
- **Authorization Register**: Stores access permissions and policies
- **eHerkenning**: Provides secure identity verification

## Sequence Diagram: Bulk Building Access

The following sequence diagram shows the DVU approval process for multiple buildings:

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

== Bulk-gebouwgegevens aanvullen == #ddf2ff
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

## Next Steps

- Review the specific implementation guides for single and bulk building access
- Understand the authorization flow and integration points
- Implement the Keyper Approve workflow in your DVU application

---

*DVU is part of the broader energy data ecosystem, enabling secure and controlled access to building energy information.*
