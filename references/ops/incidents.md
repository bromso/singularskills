# Incidents, runbooks and reviews

How the ops skills handle an incident while it happens, give the responder something to follow, and learn from it afterwards without blame.

## During an incident

- **Declare it** and set a severity as soon as users may be affected; it is cheaper to downgrade than to declare late.
- **Roles:** an **incident commander** who coordinates and decides, an **operations** lead who works the fix, and a **communications** lead who updates stakeholders and customers. On a small team one person may hold two roles; say who holds which.
- **Stabilise before diagnosing:** roll back, fail over, shed load or disable a feature first; find the cause later.
- **Recent changes first:** most incidents follow a deploy, a config change or a dependency change. Check what changed in the last hours.
- **Keep a timeline** as you go: times, what was seen, what was done, by role.
- **Update on a cadence** (every 30 minutes for a major incident), saying what is known, what is not, and when the next update comes. Customer-facing updates are written with `/support-incident-update`.
- If there are signs of a security breach, it is a security incident: follow `/security-incident-response`.

## Runbooks

A runbook is a checklist, not a manual, linked from the alert it serves (The Good Shell, *Incident Runbook Template*, https://thegoodshell.com/incident-runbook-template/; Doc Holiday, *How to Write a Runbook That Actually Gets Used in an Incident*, https://doc.holiday/blog/how-to-write-a-runbook-that-actually-gets-used-in-an-incident). Three sections, in this order:

1. **Is this real?** How to confirm users are affected: the dashboard, the query, the expected and the alarming values.
2. **Mitigations.** Each step is a copy-paste command for the service's own tooling, with the **expected output**, the **impact** ("expect 30 seconds of 503s"), and the **rollback**. Any step that **changes production** is marked so. When the tooling is unknown, the step says what to do in plain language and is marked **command to fill in**; a command is never invented.
3. **Escalate.** When to stop and call someone, and who.

Architecture background goes last. A runbook nobody has run is a draft: say when it was last exercised, never claim it was tested.

## The blameless review

A blameless review looks for systemic contributing factors, assumes people acted well on the information they had, and asks where the system **misled** the operator or asked too much of them (Google SRE Book, *Postmortem Culture*, https://sre.google/sre-book/postmortem-culture).

- **People by role,** never by name: "the on-call engineer", "the deploying engineer".
- **Contributing factors, not one root cause.** Incidents have several causes; single-cause reasoning hides systemic contributors (Okwesa, 2026, *International Journal of Social Sciences and Management Research*: "Root-Cause and Thematic Analysis for Major Incident Management: A Review").
- **Human error is a starting point, not a finding.** When a person did something that caused harm, ask what made it easy to do and hard to notice: a tool that accepted it without confirmation, an alert that fired late, a runbook that was out of date.
- **What went well,** so it is kept.
- **Action items change the system or the process,** each with an owner and a date. "Be more careful", retraining or discipline is never the fix for a systemic gap.

## Why learning from failure fails

Studies of real teams find learning from failure is informal and ad hoc, recurring failures persist without a structured process, and time pressure, turnover and scattered documents undermine it (Anandayuvaraj et al., 2025, *ICSE*: "Learning From Software Failures: A Case Study at a National Space Research Center"). Turning what was learned into real improvement is the hard part (Sillito et al., 2024, *CHASE*: "Learning From Lessons Learned"). So every review ends with owned action items, and the reliability review checks they were done.

## Alert fatigue

Repeated alarms that need no action desensitise the people who receive them and are linked to burnout. The strongest evidence comes from healthcare, so treat it as evidence from another field (Ding et al., 2023, *Nursing in Critical Care*; Michels et al., 2025, *BMC Nursing*). Keep pages few and actionable, and recovery time after a heavy shift real.
