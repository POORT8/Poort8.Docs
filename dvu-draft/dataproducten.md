# Dataproducten

DVU geeft toegang tot energiedata-producten van utiliteitsgebouwen. De daadwerkelijke uitlevering verloopt via een datadienst-aanbieder zoals Smart Data Solutions (SDS), na een policy-check in het DVU Authorization Registry.

## Beschikbare producten

| Product | Omschrijving | Doel |
|---------|--------------|------|
| **P4-meterdata** | Gestandaardiseerde meteropnamelevering volgens het P4-formaat | Basisinzicht in energieverbruik, rapportage en koppeling met dashboards |
| **Dagstanden** | Dagelijkse meterstanden | Gedetailleerd verbruiksinzicht over de tijd |

[TBD – per product opnemen: welke EAN-types, welk segment (KV/GV), welke autorisatieattributen, welke retentieperiode, welk leveringsformaat.]

## Levering

Levering vindt plaats via een datadienst-aanbieder. Zie [Aansluiten als datadienst-aanbieder](aansluiten-datadienst-aanbieder.md) voor de enforcement-flow waarmee de aanbieder vóór elke uitlevering een policy in het DVU AR controleert.

Voor de dataservice consumer (afnemer) is alleen relevant dat:

- de juiste policy is aangemaakt via Keyper (zie [Aansluiten als dataservice consumer](aansluiten-dataservice-consumer.md));
- het verzoek aan de datadienst-aanbieder de juiste EAN bevat;
- het meegestuurde bearer token afkomstig is uit het DVU Keycloak-realm.

## In voorbereiding

[TBD – aanvullende dataproducten (bv. RVO-benchmark, standaard jaarverbruik, CAR-gebaseerde producten) zijn nog niet beschikbaar in de NoodleBar Keycloak-variant. Zodra deze worden geactiveerd, beschrijven we ze hier.]
