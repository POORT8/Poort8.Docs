# How we build dataspaces

This page explains how Poort8 builds dataspaces with our partners, why we work the way we do, and what that means for you — whether you're evaluating Poort8 for your business or connecting to our APIs as a developer. Read it before you start building on top of us. It will save you surprises.

## Our philosophy: deliver value fast

Setting up a dataspace is hard. In practice it's like building a microservices architecture *between organisations*: it takes alignment, clear agreements, good documentation, and a shared understanding of where the value actually sits. Most of that only becomes concrete once data starts flowing between real parties.

So we don't try to design the whole thing up front. We don't disappear into PowerPoints, multi-year plans, and architecture documents while nothing moves. We build the smallest thing that delivers real value, put it in front of you, learn from what breaks, and iterate fast. Trying things, making mistakes early, and correcting quickly is how we get to a working dataspace in weeks instead of years.

This is a deliberate choice, and it has consequences you should understand before you commit.

## Standards: start fast, stay secure

Poort8 started out adopting the first generation of dataspace standards, such as iSHARE. We learned the hard way that the real problem was never the idea of standards — it was the mix: immature, first-generation dataspace standards applied to federative use cases that already demand more parties and roles than any centralised solution. That cocktail raised the barrier so high it took a very long time before we could actually start sharing data. All the cost came up front; the value came much later.

So we changed course. We now use established, widely-adopted internet standards — OAuth 2.0 and OpenID Connect among them — to build real use cases on genuine federative principles. The payoff is concrete: parties connecting to a Poort8 dataspace work with protocols their developers already know, with mature libraries and tooling. That lets us stand up a working *preview* dataspace quickly, without sacrificing security. We adopt dataspace-specific standards where they add value, but we don't let standards adoption become the thing that blocks data sharing.

## Two environments: preview and production

We run exactly two environments. This is intentional — fewer environments means we stay lean and ship value to you faster.

**Preview** is where we build. It's exactly what the name says:

- New features and fixes land here daily.
- It's the environment where we are *allowed* to make mistakes — that's its purpose.
- Availability and behaviour can change without notice. Preview does not carry production-grade guarantees, and you should not depend on it as a live service.
- We sometimes give customers early access to features still in active development, such as `v0` APIs. These will change.

Preview is not a no-man's-land, though. Even here you can count on a basic set of **service expectations** — not contractual guarantees (those belong to production), but a sense of what you can reasonably rely on:

- **Best-effort availability.** We aim to keep preview up and usable. It's a striving, not a guaranteed uptime percentage.
- **Advance notice of breaking changes.** Where we can, we tell you before a breaking change lands. We can't always guarantee it, but we treat it as a commitment, not a courtesy.
- **Best-effort support during office hours.** We respond to preview issues as quickly as we reasonably can during business hours.

**Production** is the stable, supported environment with the guarantees a live integration needs.

Preview is the right place to *start*. "A dataspace in a day" on preview lets everyone — you and us — see and feel the value early, before committing to a full production build. But preview is preview. If you connect your applications or integrations to it, you have to set your expectations accordingly: things will change underneath you, and that is by design, not a defect.

Moving from preview to production is real work. It's a deliberate step, not a flip of a switch — and it's the step that gives you the stability and guarantees you can build a business on. We have experience here: multiple live dataspaces have already made the move — including the [Datastelsel Verduurzaming Utiliteit](https://www.datastelselverduurzamingutiliteit.nl/) — and production runs under our ISO 27001 certification. We take that step seriously without turning it into a box-ticking exercise — and we prefer to take it once value has already been proven, not before.

## What this means for you

**If you're evaluating Poort8 (business):**
You get to real, working data sharing fast, with low up-front investment, instead of paying for months of design before anything runs. The trade-off is that the early stage runs on preview, which is not yet a production-grade service. Treat your preview connection as a way to validate value and shape requirements — not as a live service to depend on. Plan the move to production as an explicit project with its own timeline.

**If you're connecting as a developer:**
On preview, expect change. APIs — especially `v0` — can change without notice, daily deployments can briefly disrupt connections, and preview availability is best-effort rather than SLA-backed. Build defensively: don't hard-code assumptions you can't easily change, and assume anything marked `v0` is a moving target. When you need stability, that's the signal to move to production. We know disruption on preview is annoying; it's the direct cost of how fast we can deliver value, and we'd rather be honest about it than pretend preview is something it isn't.

## In short

We choose speed and learning over up-front certainty. Two environments, established standards, and a "start on preview" approach let us deliver value in weeks. The one thing we ask in return: know which environment you're on, and set your expectations to match it.
