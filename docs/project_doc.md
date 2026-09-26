# Disaster Response Coordination Platform — Product Documentation

## 1. What This Application Is

A coordination system for disaster response. When something bad happens
somewhere, this application lets people **log it, locate it, find help
near it, and hear what affected people are saying about it** — and lets
everyone watching stay updated the moment something changes.

Think of it as a shared, always-current incident board for emergency
situations — not a public news feed, not a chat app. A working tool for
coordination.

---

## 2. Who Uses It (Actors)

| Actor | Description |
|---|---|
| **Admin** | Full control. Can create, edit, and remove disaster records. |
| **Contributor** | Can log and update disaster records, but cannot remove them. |

Both roles work with the same information — the difference is purely
in what each is *allowed to do*, not what they can *see*.

---

## 3. Core Features

### 3.1 Disaster Logging
Users can record a disaster incident with:
- A **title** (short label, e.g. "Manhattan Flooding")
- A **description** (free text — what happened, where, how bad)
- A **status** (e.g. active, resolved)
- **Tags** (e.g. flood, fire, earthquake — used for filtering later)
- Who reported it, and when it was created or last changed

Once logged, a disaster can be **viewed**, **edited**, or (for admins)
**removed**. Users can also browse the full list of disasters and
**filter it** — for example, "show me only flood-related incidents."

### 3.2 Automatic Location Resolution
People describe disasters in plain language, not coordinates — e.g.
*"Heavy flooding has affected Manhattan, NYC."* The system reads that
description and figures out **where it's actually happening**, turning
a place name buried in a sentence into a precise location the system
can work with (for maps, distance search, etc.). The user never has to
manually enter a latitude/longitude.

### 3.3 Nearby Resource Discovery
Separately from disasters, the system keeps track of **resources** —
things people need in a crisis:
- Shelters
- Hospitals
- Food distribution points
- Water points
- Rescue teams

For any given disaster, a user can ask: *"What help is available near
this?"* and get back a list of resources within a chosen distance,
ordered by relevance to that disaster's location. This is how the
platform turns a raw incident into an actionable response — connecting
"something happened here" to "here's what's available to help."

### 3.4 Community Reports
Beyond official updates, the platform surfaces **what people on the
ground are saying** — reports pulled in from external, social-media-like
sources (e.g. *"Need drinking water near Manhattan"*). These are shown
alongside a disaster so responders get a sense of real, real-time
ground conditions, not just the official record.

Because this data comes from an outside source, the platform is
expected to:
- Handle it gracefully even when that outside source is slow, down, or
  returns bad data
- Avoid hammering the outside source with repeated identical requests

### 3.5 Live Updates
When a disaster is created or changed, everyone currently watching
should **see it reflected immediately** — no manual refreshing. This
keeps the incident board trustworthy as a live source of truth during
a fast-moving situation.

### 3.6 Access Control
Not every action is open to everyone:
- **Admins** can create, edit, and delete disaster records.
- **Contributors** can create and edit, but **not delete**.

This is a lightweight permission model — enough to demonstrate that
the system distinguishes *who* is allowed to do *what*, not a full
enterprise-grade access system.

---

## 4. What's Explicitly Out of Scope

- **No polished, public-facing frontend.** A simple UI, API client, or
  documented API collection is enough to demonstrate the features work.
- **No production-grade authentication.** Simple, demonstrable role
  logic is sufficient — not a hardened identity system.
- **No requirement for real external services.** Location resolution
  and community reports can be powered by mocked or simplified
  stand-ins rather than live, paid, third-party APIs.
- **No complete test coverage.** A representative few tests covering
  key behaviors are sufficient, not exhaustive coverage.
- **No guarantee of "production-ready."** This is a demonstration of
  sound engineering judgment on a realistic problem, scoped to a short
  build window — not a system meant to be deployed for real disaster
  response.

---

## 5. Optional Enhancements (Not Required)

If time allows, the platform *could* additionally support one of:
- Verifying disaster-related images using AI
- Pulling in official/government disaster updates
- Automatically prioritizing which community reports matter most
- An interactive map view
- Processing external data through a background queue instead of
  handling it inline

These are extras — the core features above take priority over any of
these.

---

## 6. What Success Looks Like

A person using this platform should be able to:
1. Report a disaster in plain language and trust the system to place
   it on the map correctly.
2. Immediately see what help is nearby.
3. Get a sense of real ground conditions through community reports.
4. Trust that the information they're seeing is current, without
   needing to refresh.
5. Know that only authorized people can create or remove official
   incident records.
