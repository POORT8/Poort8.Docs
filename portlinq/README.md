# PortlinQ

PortlinQ maakt gecontroleerde gegevensdeling mogelijk tussen binnenhavens, havenbedrijven, havenmeesters, schippers en IT-bedrijven. Via één gekozen app kunnen schippers diensten afnemen in alle deelnemende Nederlandse binnenhavens—zonder per haven verschillende systemen te gebruiken.

## Hoe werkt het?

PortlinQ faciliteert digitale havendiensten via een federatief model met drie kerncomponenten:

- **PortlinQ-IDP** (Identity Provider): Authenticeert schippers via OIDC
- **PortlinQ-ASR** (Authorization Subject Registry): Beheert participants (schepen, schippers, exploitanten) en hun relaties
- **PortlinQ-AR** (Authorization Registry): Beheert autorisatie policies en evalueert access control beslissingen

Havenbedrijven behouden volledige controle over hun data, schippers kiezen hun eigen app, en platform providers krijgen toegang tot meerdere havens via één gestandaardiseerde integratie.

## Use Cases

PortlinQ ondersteunt twee primaire flow types:

### 1. Schipper-initiated Services (Walstroom)

Schippers authenticeren, selecteren hun schip, en gebruiken services via hun app met real-time autorisatie verificatie.

[→ Bekijk de Walstroom Toegangsflow](walstroom-toegang.md)

### 2. Consent-based Automation (Geofence Arrival)

Automatische haven aanmeldingen op basis van AIS/EuRIS locatie data, met schipper consent en haven contract verificatie.

[→ Bekijk de Geofence Arrival Flow](geofence-arrival.md)

## Diensten Status

| Dienst | Type | Status |
|--------|------|--------|
| **Walstroom afname** | Schipper-initiated | 🔄 Pilot fase (RWS focus usecase) |
| **Geofence arrival/departure** | Consent-based automation | 🔄 In ontwikkeling |
| **Havengeld inning** | Schipper-initiated | 🔜 Meest mature usecase, roll-out gepland |
| **Ligplaats aanmelding** | Schipper-initiated | 🔜 Conceptueel ontwerp gereed |

## Deelnemers en rollen

PortlinQ brengt verschillende stakeholders samen:

- **Havenbedrijven (Exploitanten)** — Registreren schepen en schippers in ASR; beheren autorisatie policies in AR
- **Schippers** — Authenticeren via PortlinQ-IDP; geven consent voor services
- **Platform providers** — Connect4Shore (walstroom), geofence services, Easy2Pay (havengeld), STIW (nautische diensten)
- **Havenmeesters** — Ontvangen registraties, betalingsbevestigingen en arrival events
- **Rijkswaterstaat** — Programma sponsor voor walstroom duurzaamheidsdoelen
- **Topsector Logistiek / Connekt** — Coördineert het federatief afsprakenstelsel

## Architectuur Componenten

### PortlinQ-IDP (Identity Provider)
Authenticeert schippers via OIDC. Retourneert identity tokens met schipper claims.

### PortlinQ-ASR (Authorization Subject Registry)
- Beheert participants: schepen (ENI), schippers, exploitanten (KvK)
- Beheert relaties: schipper → exploitant, exploitant → schip
- Biedt token exchange voor ship-scoped tokens 🔜
- Verifieert participant status en relaties

### PortlinQ-AR (Authorization Registry)
- Beheert autorisatie policies (consent, contracts, access grants)
- Evalueert access control beslissingen via `explained-enforce`
- Ondersteunt fine-grained policies per resource, issuer, en service provider

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

PortlinQ is een €500.000 GVC-gefinancierd project uitgevoerd door Connekt, in opdracht van Topsector Logistiek. Het project demonstreert dat federatieve dataspace architectuur praktisch toepasbaar is in de binnenvaart sector, met:

- **Sterke authenticatie**: OIDC-based schipper authenticatie via PortlinQ-IDP
- **Participant management**: ASR beheert schepen, schippers, exploitanten en hun relaties
- **Fine-grained authorization**: AR ondersteunt consent policies, contracts, en access grants
- **Data soevereiniteit**: Havenbedrijven behouden volledige controle
- **App-keuzevrijheid**: Schippers kiezen hun eigen platform provider
- **Privacy**: Consent-based automation zonder ruwe locatie data sharing

Voor technische details over Authorization Registry en federatief datadelen, zie de [NoodleBar documentatie](../noodlebar/).

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.
