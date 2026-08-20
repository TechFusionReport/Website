# TechFusion OS — Website Implementation

`/ops` is the Access-gated TechFusion OS control surface. It extends the existing editorial Ops Dashboard rather than replacing it.

## Boundaries

- This repository owns the `/ops` frontend implementation.
- Automations owns `/ops/api/*`, authentication validation, Notion access, automation controls, and backend integrations.
- Notion owns durable editorial/workflow/task state and the cross-system architecture/documentation contract.
- Cloudflare owns live deployed Workers, routes, Access, DNS, KV bindings, secrets, and recoverable runtime cache.
- OmniRoute owns live AI provider/model routing state.

TechFusion OS aggregates those systems. It must not create a duplicate authoritative database.

## Documentation policy

Do not duplicate changing backlog, health, deployment, or infrastructure state in this file or `Agents.md`. Read those from their authoritative systems. This document describes only implementation boundaries that developers need while changing `/ops`.

Cross-system architecture and ownership rules are maintained in Notion under **TechFusion OS — Architecture & Documentation Contract**. Repository-specific implementation details belong here. PRs document individual code changes.

## Phase 1

1. Rename the shell to TechFusion OS.
2. Preserve the existing Command Center/overview API and all editorial review behavior.
3. Group existing editorial functions under Editorial.
4. Reserve navigation for Agents & Automation, AI / OmniRoute, Infrastructure, Development, Work, Analytics & Business, and System.
5. Planned modules must be visibly marked planned until backed by real authoritative data. Never render fabricated health or counts.
6. Add backend endpoints in Automations before frontend modules that depend on them.

## Safety

Human confirmation remains required for publishing, destructive operations, bulk actions, security changes, credential changes, and AI regeneration where the operating contract requires it. Never render secret values in the frontend.