# NomoVita Care Navigator (demo)

A small web demo of a follow-up tracker and care navigator. It flags delayed screening results, missed antenatal visits, specialist referrals that were not accepted, and incomplete handoffs between a maternity hospital and primary care. Every flag comes with a plain explanation for a care coordinator: why it fired, who owns the next step (the unassigned queue if no coordinator is assigned) and the condition that closes the case.

**Rules, not AI: every flag comes from a written rule shown with it.**

Demo version 1.0, 19 November 2026. All case data are synthetic. Dates and deadlines are illustrative workflow data, not clinical recommendations.

## Run

Open `index.html` in a modern browser. No server, build step, installation or network connection is needed. The page uses system fonts only and makes no external requests.

## What is inside

- **Five synthetic cases.** A screening result not received, a planned antenatal visit not recorded, a specialist referral not accepted, a hospital discharge handoff not accepted by primary care, and a postnatal follow-up due soon.
- **Flags with explanations.** The block "Why this case is flagged" on each case card shows the rule that fired, the case data it fired on, the deadline and days past due or left, who owns the next step now, the next step and the condition that closes the case.
- **Case ownership.** Assign a coordinator, simulate sending and accepting a handoff, record a synthetic completion reference. A case closes only with an owner, an accepted handoff (where there is one), a completion reference and a confirming coordinator. Accepting a handoff does not change the owner: the coordinator who owns the case stays responsible for it until it is closed or reassigned. Reopening clears the old reference and the handoff acceptance.
- **Patient notification queue (simulation).** The demo queues plain-language messages when an owner is assigned, a handoff is accepted or a step is closed, and rules R4 and R2 queue reminders for visits and follow-ups that are due within 2 days or past due. Every message is shown as "Queued, not sent (simulation)". No SMS, email, push or messenger message is sent.
- **Coordinator queue.** A separate internal queue of rule notices, one per case and rule, rerouted when ownership changes.
- **Demo date.** "Advance demo date by 1 day" shows how flags and reminders appear as time passes; "Back to 18 Nov 2026" returns to the start.
- **Filters and export.** All, Open, Flagged and Closed, plus a filter by owner. Export JSON contains the cases, the flags with explanations, both queues, the audit log, the demo date and the version.
- **Action and closure trail.** A demo audit log of case actions: assignment, handoff, acceptance, completion, closure and reopening. Date changes, queue checks and acknowledgements are not logged, and "Reset synthetic demo" clears the log.

## Rules

| Rule | Condition | Owner of the next step |
| --- | --- | --- |
| R1 No owner | The case is open and no coordinator is assigned. | Unassigned queue |
| R2 Past due | The case is open and its due date is before the demo date. Wording by type: result not received, visit not recorded, referral not completed, handoff not closed, follow-up not done. | Assigned coordinator |
| R3 Handoff not accepted by receiving team | A handoff was sent and the receiving team has not recorded acceptance. | Receiving team |
| R4 Due within 2 days | The case is open, no completion is recorded and the due date is the demo date or within the next 2 days. | Assigned coordinator |

Two cases refer to an open switch of the companion module. The missed visit takes the owner and closing condition of open switch 26 ("Scheduled visit missed": owner is a coordinator; closes with a new contact or a documented exception). The hospital handoff refers to open switch 44 ("Hospital discharge summary received"); in this demo its closure needs the receiving primary care team's acceptance and a completion reference, while the switch in the module closes when recommendations are accepted and tasks are created. Each such case shows "Open switch N of the NomoVita Pregnancy Pathway module" on its card. All five cases are flagged only by the four rules above.

## Data

All data are synthetic: "Synthetic patient 01" and so on, with no names, phone numbers or identification numbers. The demo date starts at 18 November 2026. State is kept in this browser only (`localStorage`, key `nomovita-care-navigator-v2`); if storage is unavailable the demo works in memory and says so. "Reset synthetic demo" asks for confirmation and restores the five cases, the empty queues and the start date. Do not enter personal information.

## Limitations

- No real SMS, email, push or messenger delivery; the patient queue is a simulation.
- No sign-in and no roles; the "confirming coordinator" is a simulated identity.
- No secure storage and no tamper-proof audit log; state lives in the browser.
- No integrations with clinical or administrative systems.
- Choosing a coordinator is not proof that a real team accepted a handoff. A typed completion reference is not verified evidence.
- No AI or machine learning, no clinical triage and no check of clinical deadlines.
- It demonstrates workflow transitions. It does not show improved health outcomes.

## Tests

Run `node test.js` (Node.js, no packages needed). It tests the rules, explanations, both queues, the demo date, filters, export, reset and a static check of the sources, and prints `N/N tests passed`. Check the interface script with `node --check ui.js`.

## Companion

A companion to the [NomoVita Pregnancy Pathway module](https://astralnomade.github.io/nomovita-pregnancy-pathway/).

## License

Apache License 2.0 (see `LICENSE`). Copyright 2026 Leila Ishbayeva, NOMOVITA LLP. All case data in this repository are synthetic.

## Contact

NOMOVITA LLP, Astana, Kazakhstan · https://nomovita.ai
