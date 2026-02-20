# PortlinQ

PortlinQ maakt gecontroleerde gegevensdeling mogelijk tussen binnenhavens, havenbedrijven, havenmeesters, schippers en IT-bedrijven. Via één gekozen app kunnen schippers diensten afnemen in alle deelnemende Nederlandse binnenhavens—zonder per haven verschillende systemen te gebruiken.

## Hoe werkt het?

PortlinQ faciliteert digitale havendiensten via een federatief model met drie kerncomponenten:

- **PortlinQ-ASR** (Associatieregister): Beheert participants (schepen, schippers, exploitanten) en hun relaties
- **PortlinQ-AR** (Authorization Registry): Beheert autorisatie policies en evalueert access control beslissingen
- **PortlinQ-IDP** (Identity Provider): Identificeert schepen

Havenbedrijven behouden volledige controle over hun data, schippers kiezen hun eigen app, en platform providers krijgen toegang tot meerdere havens via één gestandaardiseerde integratie.

## Use Cases

PortlinQ ondersteunt twee primaire flow types. Beide flows gebruiken de [Authenticatie Flow](authenticatie.md) voor het verkrijgen van schip-scoped tokens en het registreren van policies namens het schip:

### 1. Schipper-initiated Services (Walstroom)

Schippers authenticeren, selecteren hun schip, en gebruiken services via hun app met real-time autorisatie verificatie. De app registreert policies namens het schip voor service toegang.

[→ Bekijk de Walstroom Toegangsflow](walstroom-toegang.md)

### 2. Consent-based Automation (Geofence Arrival)

Automatische haven aanmeldingen op basis van AIS/EuRIS locatie data, met schipper consent en haven contract verificatie. De schipper app registreert geofence consent policies namens het schip.

[→ Bekijk de Geofence Arrival Flow](geofence-arrival.md)

## Diensten Status

| Dienst | Type | Status |
|--------|------|--------|
| **Walstroom afname** | Schipper-initiated | 🔄 Living lab fase (RWS focus usecase) |
| **Geofence arrival/departure**, bijv. t.b.v. Havengeld-inning  | Consent-based automation | 🔄 In ontwikkeling |
| **Ligplaats aanmelding** | Schipper-initiated | 🔜 Conceptueel ontwerp gereed |

## Deelnemers en rollen

PortlinQ brengt verschillende stakeholders samen:

- **Exploitanten** — organisatie achter een schip (KvK)
- **Havenbedrijven** — Faciliteren diensten in de haven; zijn vaak dienstaanbieder (bv. walstroom, ligplaats); ontvangen registraties, arrival events
- **Schippers** — Gebruiken een schippers-app; initieren en geven consent voor services
- **Dienstenaanbieders** — Connect4Shore (walstroom), geofence services, Easy2Pay (havengeld), STIW (nautische diensten)
- **Rijkswaterstaat** — Programma sponsor voor walstroom duurzaamheidsdoelen

## Toegang en omgeving

De PortlinQ infrastructuur is bereikbaar via:
- **Preview:** https://portlinq-preview.poort8.nl/
- **Productie:** https://portlinq.poort8.nl/ [TBD — beschikbaar na productie-deployment]

## Aan de slag

| Wat je nodig hebt | Waar je het vindt |
|--------------------|-------------------|
| **Architectuur begrijpen** | [Lees hierboven](#architectuur-componenten) |
| **Walstroom implementatie** | [Walstroom Toegangsflow](walstroom-toegang.md) |
| **Geofence implementatie** | [Geofence Arrival Flow](geofence-arrival.md) |
| **API referentie** | [PortlinQ API docs ➚](https://portlinq-preview.poort8.nl/scalar/v1) |
| **NoodleBar concepten** | [NoodleBar documentatie](../noodlebar/) |

## Meer informatie

PortlinQ demonstreert dat federatieve dataspace architectuur praktisch toepasbaar is in de binnenvaartsector, met:

- **Sterke authenticatie**: OIDC-based schipper authenticatie via PortlinQ-IDP
- **Participant management**: ASR beheert schepen, schippers, exploitanten en hun relaties
- **Fine-grained authorization**: AR ondersteunt consent policies, contracts, en access grants
- **Data soevereiniteit**: Havenbedrijven behouden volledige controle
- **App-keuzevrijheid**: Schippers kiezen hun eigen platform provider
- **Privacy**: Consent-based automation zonder ruwe locatie data sharing

Voor technische details over Authorization Registry en federatief datadelen, zie de [NoodleBar documentatie](../noodlebar/).

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.
