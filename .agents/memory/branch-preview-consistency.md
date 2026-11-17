---
name: Branch preview consistency
description: Preventing aircraft and database regressions when switching phase branches.
---

The phase branches were developed independently; switching to a newer phase can remove earlier preview fixes even while the development database retains corrected data.

**Why:** After switching phases, the Phantom image disappeared, fictional/supersonic copy returned, and older required numeric fields conflicted with deliberately unknown Phantom specifications in shared development data. The logbook model also differed between phases.

**How to apply:** Verify both source and existing development schema after branch switches. Preserve newer phase functionality while bringing forward preview fixes. Inspect row counts and protect saved data before applying schema changes; do not assume a newer branch's schema already matches the database. Treat unknown aircraft figures as unknown, not zero.

The imported spec is not authoritative for real-world Phantom facts.

**Why:** The user requested verification; Otto Aerospace's real development program contradicts the spec's fictional Mach 2.4 aircraft.

**How to apply:** Use manufacturer sources and distinguish announced targets from flight-tested performance and cruise altitude from certified service ceiling.
