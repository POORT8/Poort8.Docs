# Data Sources

HeyWim connects to multiple data sources to provide comprehensive container and vessel tracking information. We integrate with shipping lines, deepsea terminals, and inland terminals to give you complete visibility of your shipments.

## Data Standards

HeyWim follows the **Track & Trace (T&T) standards** developed by DCSA (Digital Container Shipping Association). This means data is displayed as standardized events, such as vessel departures, container discharges, or gate movements.

### DCSA Event Types

HeyWim provides several types of DCSA T&T-compliant events:

- **Transport Events**: Vessel and vehicle movements (f.e. arrivals, departures)
- **Equipment Events**: Container-specific activities (f.e. discharge, loading, gate operations)
- **Shipment Events**: Shipment-level activities (f.e. booking confirmations)

**Additional Features**: HeyWim also provides cargo opening and closing times through Shipment events, though this specific usage is not DCSA compliant.

Learn more about DCSA T&T standards:
- [DCSA Website](https://dcsa.org/standards/track-and-trace)
- [Official Documentation](https://dcsa.org/standards/track-and-trace/standard-documentation-track-and-trace)

## Shipping Lines

We connect to the following major shipping lines to provide container tracking information:

### Global Carriers

| Shipping Line | Carrier Code | API Integration | Information Required |
|---------------|--------------|-----------------|----------------------|
| **Arkas** | AKS | ✅ | Container number |
| **CMA CGM** | CMA | ✅ | Container number |
| **COSCO** | COS | ✅ | Container number |
| **Evergreen** | EVG | ✅ | Container number, Bill of lading* |
| **Hapag-Lloyd** | HLC | ✅ | Container number |
| **HMM** | HMM | ✅ | Container number, Bill of lading* |
| **Maersk** | MSK | ✅ | Container number, Bill of lading* |
| **MSC** | MSC | ✅ | Container number, Bill of lading* |
| **ONE** | ONE | ✅ | Container number |
| **OOCL** | OOL | ✅ | Container number |
| **Yang Ming** | YML | ✅ | Container number |
| **ZIM** | ZIM | ✅ | Container number |

*Bill of lading is optional but recommended for more comprehensive data

## Deepsea Terminals

We provide terminal information from major European ports:

### Netherlands
- **APM Terminals** (Rotterdam) - Container movements and vessel schedules
- **ECT** (Rotterdam) - Container movements and vessel schedules  
- **Delta2** (Rotterdam) - Container movements and vessel schedules
- **RWG - Rotterdam World Gateway** (Rotterdam) - Container movements and vessel schedules

### Belgium
- **MPET** (Antwerp) - Container movements and vessel schedules
- **CSP** (Zeebrugge) - Vessel information via NxtPort
- **DP World** (Antwerp) - Vessel information via NxtPort
- **PSA** (Antwerp) - Vessel information via NxtPort

### Germany
- **HHLA** (Hamburg) – Vessel schedules and container movements
- **Eurogate** (Hamburg, Bremerhaven, Wilhelmshaven) – Vessel schedules and container movements
- **NTB** (Bremerhaven) – Vessel schedules (coming soon)
- **MSC Gate** (Bremerhaven) – Vessel schedules and container movements

## Inland Terminals

For inland container tracking, we can connect to most large terminals in The Netherlands.

## Data Availability

### Information Types
- **Vessel schedules**: Estimated and actual arrival/departure times
- **Container movements**: Discharge, loading, gate in/out events
- **Cargo availability**: Terminal opening and closing times for pickup
- **Transport events**: Truck and rail movements (where available)

### Data Quality Notes
Different terminals and carriers may provide varying levels of detail in their tracking information:

- **Estimated vs. Actual times**: Some sources provide estimated times that may not be updated to actual times once events occur
- **Event types**: Container movements may be categorized differently depending on the transport method (truck, barge, rail)
- **Data completeness**: Information availability varies by source and operational conditions

For the most comprehensive tracking, HeyWim combines data from multiple sources to provide complete visibility of your shipments.

## Enhanced Features

### Booking References
Providing booking references (Bill of Lading numbers) along with container numbers often results in:
- More detailed tracking information
- Additional milestone events
- Better data accuracy
- Access to booking-specific information

## Publisher-Specific Data Interpretation

Different data sources may interpret and provide event data in unique ways. Understanding these variations helps explain the tracking information you receive.

### EGS (European Gateway Services)

**Data Characteristics:**

| Data Field | Behavior | Impact on Tracking |
|------------|----------|-------------------|
| **Pickup and Delivery Times** | Provides estimated times only; does not update to actual times when events occur | You'll see estimated events but may need additional sources for actual completion times |
| **Gate-In Events** | Interpretation varies by transport method | **Barge/Train**: Shows as discharge event<br>**Truck**: Shows as gate-in event |

**What This Means for You:**
- EGS provides reliable estimated scheduling information
- For actual event times, combine with other data sources when available
- Transport method affects how gate operations are categorized

---

## Support

For questions about data sources or to request access to specific carriers:

**Email**: hello@poort8.nl
**Support**: Available during business hours (CET/CEST)

*Data availability and update frequency may vary by source and operational conditions*
