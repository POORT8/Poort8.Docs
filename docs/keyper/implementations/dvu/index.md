---
title: "DVU"
nav_order: 2
parent: "Implementations"
has_children: true
layout: default
---

## Subpages
- [Add single building](context.html)
- [Add multiple buildings](gebouwen-in-bulk.html)

# DVU Implementation Context

#work-in-progress

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
