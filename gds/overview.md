# GDS Overview

## What is GDS?
The **Green Data Space (GDS)** is a proof-of-concept demonstrating secure, sovereign data sharing for building management and energy optimization. It solves a fundamental challenge: how to give building management systems access to IoT sensor data without building owners losing control over who sees what.

GDS enables controlled data exchange between:
- **IoT Sensor Platforms** (Data service providers) – Organizations that install and manage building sensors
- **Building Management Systems** (Data service consumers) – Platforms that use sensor data to optimize building performance

The system is built on Poort8's NoodleBar dataspace technology and demonstrates trusted data sharing in the built environment sector.

**Key principle**: Building owners maintain complete control over their data, approving specific access requests while enabling valuable optimization services.


## The problem GDS solves

### Traditional approach: loss of control
When building owners want to use optimization services today, they typically must:
1. Give full access to their sensor data to the service provider
2. Trust that provider won't misuse or share the data
3. Accept vendor lock-in with limited ability to switch providers
4. Deal with custom integrations for each new service

**Result**: Building owners hesitate to share valuable sensor data, limiting optimization opportunities.

### GDS approach: sovereign data sharing
With GDS, building owners:
1. Grant specific, limited permissions for each service and building
2. See exactly what data is requested and who will use it
3. Approve or reject requests through secure authentication
4. Maintain control and can revoke access anytime

**Result**: Building owners confidently share data, enabling better building optimization while maintaining sovereignty.


## Key participants & their roles
GDS involves five distinct roles in the data ecosystem. To make these roles clear, we use personas throughout the documentation:

### Alice – Building owner (data owner)
Alice owns a commercial building with IoT sensors installed. She wants to enable energy optimization services but needs to maintain control over her building's data. Through GDS, Alice receives approval requests and decides who can access which data for what purpose.

**Her value**: Complete visibility and control over building data sharing.

### Bob – Building manager (data end-user)
Bob manages building operations and wants to optimize energy usage and tenant comfort. He uses a building management platform to access sensor insights and make data-driven decisions.

**His value**: Seamless access to sensor data from multiple buildings, all authorized by the building owners.

### Charlie – IoT sensor platform (data service provider)
Charlie represents the organization that installs and operates building IoT sensors. Instead of creating custom integrations with every building management platform, Charlie implements one standardized dataspace connector that works with all compliant systems.

**Their value**: Reduced integration costs, expanded market reach, and increased trust from building owners.

### Mallory – Building management platform (data service consumer)
Mallory represents platforms that provide building optimization services. Through GDS, Mallory can request access to sensor data from various IoT providers using standardized protocols, rather than building custom integrations for each provider.

**Their value**: Faster time-to-market, lower integration costs, and access to more buildings through trusted approval processes.

## What makes GDS different?

### 1. Data sovereignty
Building owners (Alice) maintain complete control. Every data access requires explicit approval through secure email verification. Permissions are granular – approval is required per building, per service, per purpose.

### 2. Standardized integration
IoT providers (Charlie) and building management platforms (Mallory) use the same integration pattern. This means:
- IoT providers integrate once, work with all compliant platforms
- Building platforms integrate once, work with all compliant IoT providers
- New participants join easily without custom development

### 3. Transparent approval process
When a building management platform (Mallory) wants sensor data, the building owner (Alice) receives a clear request showing:
- Who wants access (which organization)
- On behalf of whom (which building manager)
- What data they need (which building, which sensors)
- What they'll do with it (optimization, analytics, etc.)
- How long access will last

## Real-world use case example
Let's walk through how Alice, Bob, Charlie, and Mallory interact in a typical scenario:

### Initial situation
- **Alice** owns an office building in Rotterdam with environmental sensors installed by Charlie's IoT platform
- **Bob** manages Alice's building and wants to use Mallory's optimization platform to reduce energy costs
- **Charlie** (IoT platform) has real-time temperature, humidity, and energy consumption data
- **Mallory** (building management platform) can provide optimization recommendations if given access to sensor data

### The GDS Flow

**Step 1: Bob initiates request**
- Bob logs into Mallory's building management platform
- Searches for Alice's building
- Sees that sensor data is "Not Requested" and clicks "Request Access"

**Step 2: Alice reviews request**
- Alice receives an email: "Building management platform requests access to sensor data"
- Opens the secure approval link
- Reviews exactly what's being requested: real-time environmental sensor data for her Rotterdam building
- Sees who's requesting: Mallory's platform, on behalf of building manager Bob

**Step 3: Alice approves**
- Alice approves the request
- GDS registers the policy in the Authorization Registry

**Step 4: Data flows securely**
- Mallory's platform can now retrieve sensor data from Charlie's IoT platform
- Charlie's system verifies each request against the GDS Authorization Registry
- Only approved data for the approved building is shared
- Bob sees real-time insights in his dashboard

**Step 5: Ongoing control**
- Alice can check active permissions anytime
- She can revoke access if needed
- When permissions expire, access automatically stops

### The result
- **Alice** maintains control while enabling valuable services
- **Bob** gets the insights he needs to optimize building performance
- **Charlie** serves multiple building management platforms with one integration
- **Mallory** accesses sensor data from multiple IoT providers using standardized protocols

## Core data transactions
GDS enables two types of data exchange, progressing from initial setup to ongoing operations:

### Real-time measurements
The core operational transaction – retrieving live sensor data for analysis and optimization.

**Example**: "Get current temperature readings for building X"

### Control commands
For advanced optimization, the platform can send control setpoints back to the building sensors (within approved limits).

**Example**: "Adjust HVAC setpoint to 21.5°C for building X"

Each transaction requires explicit building owner approval. Requests for certain permissions can be bundled (e.g., approve both the retrieval of data and the control of a sensor at once) to reduce friction.


## Benefits for each participant

### For building owners (Alice)
- **Maintain control** over building data at all times
- **Transparent requests** showing exactly what's being shared
- **Granular permissions** per building, per service, per purpose
- **Revoke access** anytime without complex contract negotiations
- **Enable services** confidently, knowing data won't be misused

### For building managers (Bob)
- **Seamless access** to sensor data from multiple buildings
- **No technical complexity** – authorization handled in background
- **Better insights** enabling data-driven building management
- **Trusted by owners** due to transparent approval process

### For IoT sensor platforms (Charlie)
- **Integrate once**, work with all compliant building management platforms
- **Reduced costs** compared to custom integrations
- **Expanded market** by making data easily accessible to authorized services
- **Increased trust** from building owners through sovereignty model
- **Future-proof** through standards-based approach

### For building management platforms (Mallory)
- **Integrate once**, access sensor data from multiple IoT providers
- **Faster time-to-market** for new building integrations
- **Lower development costs** compared to custom integrations
- **Access more buildings** through trusted approval workflows
- **Focus on value** (optimization algorithms) instead of integration complexity

### For the ecosystem
- **Interoperability** enables market growth
- **Innovation** through easy participant onboarding
- **Scalability** through federated architecture


## Next Steps

Want to understand the technical architecture? See the **[Architecture Guide](architecture.md)** to learn how GDS components work together.

Ready to build? Jump to **[Requesting Building Data Access](consumer-approval-guide.md)** to implement the approval workflow.

Have questions? Contact Poort8 at **hello@poort8.nl**.