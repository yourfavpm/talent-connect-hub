# PRD Implementation Roadmap

This document is the working backlog for features not yet fully implemented from the product requirements document (PRD).

---

## Epic 0: Platform Hardening (Pre-work)

### Story 0.1 - Role model normalization
- Align canonical roles across UI + DB: `super_admin`, `admin`, `talent_manager`, `operations_manager`, `billing_manager`, `support_manager`
- Update role mapping helpers and sidebar permissions
- **Acceptance:** one source of truth role map; no mixed legacy/new role names in guards

### Story 0.2 - Talent Manager backend enforcement
- Add RLS + RPC checks for manager-scoped access on talent-related reads/writes
- Enforce assigned ownership via `talent_manager_admin_id`
- **Acceptance:** manager cannot query/update non-owned talent via API even with manual request

### Story 0.3 - Supabase type regeneration + RPC contract cleanup
- Regenerate `types.ts`, remove `as any` from critical data paths
- Add typed wrappers for key RPCs
- **Acceptance:** no `any` in critical vetting/hiring/assignment modules

### Story 0.4 - Legacy/v2 consolidation guardrails
- Freeze legacy paths; route all new writes to v2
- Add migration notes + deprecation flags
- **Acceptance:** assignment/vetting status updates happen in one canonical model

---

## Epic 1: Assessment Engine v1 (Talent + Admin)

### Story 1.1 - Data model
- Create: `assessments`, `assessment_sections`, `assessment_questions`, `assessment_attempts`, `assessment_answers`, `assessment_scores`
- Add role/category tags and versioning
- **Acceptance:** can publish role-based assessment with versioned question set

### Story 1.2 - Talent assessment runtime
- Timed test session, autosave answers, submit/lock flow
- Basic anti-cheat signals (tab switch count, elapsed anomalies)
- **Acceptance:** talent can complete and submit assessment safely after profile completion

### Story 1.3 - Scoring + feedback
- Auto-score objective items; support manual review fields for scenario/practical
- Breakdown by section + final score payload
- **Acceptance:** score and feedback visible in talent portal and admin view

### Story 1.4 - Admin assessment management UI
- Create/edit questions, set duration, pass threshold, publish/unpublish
- **Acceptance:** admin can manage assessments without DB edits

---

## Epic 2: Classification Rules Engine

### Story 2.1 - Rule model
- Create: `classification_levels`, `classification_rules`, `classification_rule_versions`, `classification_decisions`
- Include score thresholds + override reason logging
- **Acceptance:** level assignment is rule-driven and auditable

### Story 2.2 - Decision service (RPC)
- RPC computes level from assessment + profile + vetting factors
- Supports admin override with reason
- **Acceptance:** every classification decision has rule version + evidence trail

### Story 2.3 - Talent-facing explanation
- Show "why this level" and "next steps to improve"
- **Acceptance:** talent sees transparent explanation and path to advancement

---

## Epic 3: Client Managed Service v1

### Story 3.1 - Managed service request form
- Add fields: expected outcomes, budget, required roles, target hours, timeline, KPIs
- **Acceptance:** client can submit complete managed service request

### Story 3.2 - Client dashboard (real metrics)
- Replace placeholders with live metrics:
  - active engagements
  - team utilization
  - open deliverables
  - upcoming interviews
- **Acceptance:** dashboard cards and lists are DB-backed

### Story 3.3 - Discovery filter upgrades
- Add filter facets: vetting level, assessment score band, role family
- **Acceptance:** client can narrow talent list by capability, not just name/role text

---

## Epic 4: Performance Management Core

### Story 4.1 - KPI schema
- Create: `kpi_definitions`, `kpi_targets`, `kpi_measurements`, `performance_periods`, `performance_reviews`
- **Acceptance:** KPI lifecycle supports weekly/monthly tracking

### Story 4.2 - Admin KPI operations
- Define KPI templates, assign targets per talent/team/client
- Log outcomes and trigger actions (promote/training/reassign)
- **Acceptance:** admin can run periodic performance cycles

### Story 4.3 - Client/Talent visibility
- Client sees agreed KPIs and trend charts
- Talent sees personal KPI status and feedback
- **Acceptance:** role-based KPI transparency works with permissions

---

## Epic 5: Service Delivery Tracking

### Story 5.1 - Delivery entities
- Create: `projects`, `deliverables`, `work_items`, `milestones`, `delivery_status_events`
- **Acceptance:** managed service work is trackable beyond contracts/timesheets/invoices

### Story 5.2 - Ops workflow
- Admin/TM can assign work, update status, flag risk, log blocker
- **Acceptance:** each deliverable has owner, due date, and state timeline

### Story 5.3 - Health dashboard
- Show on-track/at-risk/completed by client/team/talent
- **Acceptance:** operational risk can be seen at a glance

---

## Epic 6: Academy Module

### Story 6.1 - Academy schema
- Create: `academy_courses`, `academy_modules`, `academy_enrollments`, `academy_progress`, `academy_assessments`
- **Acceptance:** courses can be assigned and tracked

### Story 6.2 - Talent academy UX
- Course list, lesson progress, completion state
- **Acceptance:** talent can complete assigned learning paths

### Story 6.3 - Admin academy management
- Upload content metadata, create paths by role/level, assign cohorts
- **Acceptance:** admin can operationalize Train-to-Hire flow

---

## Epic 7: Reporting and Analytics

### Story 7.1 - Reporting views/materialized views
- Build analytics views for deployment rate, time-to-hire, retention, performance trend
- **Acceptance:** dashboards query stable reporting views, not raw transactional joins

### Story 7.2 - Report center
- Downloadable client/talent/performance reports (CSV/PDF later)
- **Acceptance:** role-scoped reporting available in admin/client portals

### Story 7.3 - Ops intelligence
- Add early warning indicators: attrition risk, delayed onboarding, low-quality funnel
- **Acceptance:** operational alerts generated from metrics

---

## Cross-Cutting Technical Tasks

- Add test coverage:
  - RLS enforcement tests
  - RPC contract tests
  - Critical E2E flows: talent onboarding -> assessment -> classification -> assignment
- Add audit logs for:
  - Assignment changes
  - Classification overrides
  - KPI edits
- Add feature flags per epic for safe rollout

---

## Suggested Sprint Sequence (10 Sprints)

1. Sprint 1: Epic 0 (hardening)
2. Sprint 2-3: Epic 1 (assessment v1)
3. Sprint 4: Epic 2 (classification engine)
4. Sprint 5: Epic 3 (client managed service v1)
5. Sprint 6-7: Epic 4 (performance core)
6. Sprint 8: Epic 5 (delivery tracking)
7. Sprint 9: Epic 6 (academy v1)
8. Sprint 10: Epic 7 (reporting/analytics v1)
