# Recon CRM Engineering Review

**Review scope:** repository state at `4e9bbad` on 2026-07-17. This review covers source, configuration, migrations, documentation, and relevant Git history. It excludes generated output (`.next`, `lib/generated/prisma`), installed dependencies (`node_modules`), and runtime data. Conclusions below are limited to evidence available in the repository.

## 1. Executive Summary

Recon CRM is an internal business-operations application for Recon Dev LLC. It records website intake, service requests, clients, projects, tasks, notes, files, quotes, invoices, settings, and activity. The application exists to keep those records in one owner-operated workspace and to move an inquiry through delivery and billing without relying solely on temporary browser state. The product metadata identifies its purpose as “Client and project management for Recon Dev LLC,” while the authentication documentation explicitly defines a single-owner model ([app/layout.tsx](../app/layout.tsx), [docs/auth.md](./auth.md)).

The intended user currently evidenced by the repository is the business owner, not a customer, employee team, or public SaaS tenant. All CRM pages are protected by one owner password and one signed-cookie session mechanism; there are no `User`, `Role`, `Organization`, or permission models ([lib/auth/require-auth.ts](../lib/auth/require-auth.ts), [lib/auth/session.ts](../lib/auth/session.ts), [prisma/schema.prisma](../prisma/schema.prisma)). External website servers are a second system actor, but only for signed intake submission through `POST /api/public/intake` ([docs/public-intake-api.md](./public-intake-api.md)).

The implementation is a Next.js App Router monolith: React pages and route handlers share one codebase, Prisma provides PostgreSQL access, and a client-side context hydrates the workspace from protected JSON APIs. Persistence and workflow integrity have improved incrementally through committed migrations, including unique links for intake-to-request, request-to-project, and quote-to-invoice transitions ([context/crm-context.tsx](../context/crm-context.tsx), [prisma/schema.prisma](../prisma/schema.prisma), [docs/persistence-transition-log.md](./persistence-transition-log.md)).

The repository is functional but not yet strongly production-controlled. Its principal risks are the absence of automated tests, inconsistent API validation, single-owner authentication with no login throttling, local-disk file storage, weak relational enforcement between many business entities, and documentation that does not always match the current implementation. These are incremental hardening opportunities; the evidence does not justify a rewrite.

## 2. System Overview

### Major subsystems

| Subsystem | Responsibility | Repository evidence |
| --- | --- | --- |
| CRM workspace | Authenticated dashboard and pages for business records | [`app/(crm)`](../app/(crm)), [components/app-sidebar.tsx](../components/app-sidebar.tsx) |
| Shared UI state | Loads eleven API resources in parallel, maps persisted records, and exposes mutable collections | [context/crm-context.tsx](../context/crm-context.tsx), [lib/crm-record-mappers.ts](../lib/crm-record-mappers.ts) |
| Internal API | CRUD and conversion operations for CRM entities | [`app/api`](../app/api), [lib/auth/require-auth.ts](../lib/auth/require-auth.ts) |
| Public intake boundary | Authenticates and validates server-to-server website inquiries | [app/api/public/intake/route.ts](../app/api/public/intake/route.ts), [docs/public-intake-api.md](./public-intake-api.md) |
| Persistence | PostgreSQL models, migrations, and Prisma access | [prisma/schema.prisma](../prisma/schema.prisma), [prisma/migrations](../prisma/migrations), [lib/prisma.ts](../lib/prisma.ts) |
| Authentication | Owner password verification and stateless signed session cookie | [`lib/auth`](../lib/auth), [app/api/auth](../app/api/auth), [app/login/page.tsx](../app/login/page.tsx) |
| File storage | Authenticated upload/download with metadata in PostgreSQL and bytes on local disk | [app/api/files/route.ts](../app/api/files/route.ts), [app/api/files/[fileId]/download/route.ts](../app/api/files/[fileId]/download/route.ts) |

### High-level architecture

The following diagram reflects implemented request paths only:

```text
Trusted website server
        |
        | Bearer key + timestamped HMAC
        v
POST /api/public/intake -----> IntakeSubmission
                                      |
Owner browser                         v
  | password login              ServiceRequest
  | signed HTTP-only cookie           |
  v                                   v
Authenticated CRM pages ----------> Project ----> Task / Note / File
  |                                   |
  | fetch protected JSON APIs         +---------> Quote ----> Invoice
  v
Next.js route handlers -----------> Prisma -----------> PostgreSQL
                                          |
                                          +-----------> local uploads/files
```

The browser does not query Prisma directly. It calls route handlers, which authenticate and perform database operations. Pages then reconcile returned records into `CrmProvider` state through explicit mapper functions ([context/crm-context.tsx](../context/crm-context.tsx), [lib/crm-record-mappers.ts](../lib/crm-record-mappers.ts)).

## 3. Business Workflow

The implemented lifecycle is more accurately represented as:

```text
Website inquiry -> Intake submission -> Service request -> Project
                                                 |          |-- Tasks
                                                 |          |-- Notes
                                                 |          |-- Files
                                                 |
Client ------------------------------------------+---------- Quote -> Invoice

Important changes across the workflow ---------------------> Activity log
```

1. A trusted website server can create an `IntakeSubmission` through the signed public endpoint. Duplicate `inquiryId` values return the existing record ([app/api/public/intake/route.ts](../app/api/public/intake/route.ts)). An owner can also create intake through the protected internal endpoint ([app/api/intake/route.ts](../app/api/intake/route.ts)).
2. Intake can be converted into one `ServiceRequest`. `ServiceRequest.intakeSubmissionId` is unique, and repeated conversion attempts reuse the persisted request ([app/api/service-requests/route.ts](../app/api/service-requests/route.ts), [prisma/migrations/20260701000000_unique_service_request_intake_submission/migration.sql](../prisma/migrations/20260701000000_unique_service_request_intake_submission/migration.sql)).
3. A service request can be converted into one project. The conversion endpoint performs project creation/reuse, request status change, and activity creation in one Prisma transaction. `Project.serviceRequestId` is unique ([app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts), [prisma/migrations/20260630230000_prevent_duplicate_service_request_projects/migration.sql](../prisma/migrations/20260630230000_prevent_duplicate_service_request_projects/migration.sql)).
4. Projects organize tasks, notes, files, and billing references in the UI. These links are represented as scalar IDs and copied names rather than Prisma relations ([prisma/schema.prisma](../prisma/schema.prisma), [app/(crm)/projects/[projectId]/page.tsx](../app/(crm)/projects/[projectId]/page.tsx)).
5. Quotes and invoices are separate records. An invoice may link to a quote, and a unique `Invoice.quoteId` prevents more than one invoice for a quote ([app/api/invoices/route.ts](../app/api/invoices/route.ts), [prisma/migrations/20260524012431_prevent_duplicate_quote_invoices/migration.sql](../prisma/migrations/20260524012431_prevent_duplicate_quote_invoices/migration.sql)).
6. Activity is both manually persisted by UI helpers and automatically created by selected workflows, notably public intake and service-request conversion ([lib/log-activity.ts](../lib/log-activity.ts), [app/api/public/intake/route.ts](../app/api/public/intake/route.ts), [app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts)).

The repository does not implement payment processing, quote acceptance, project completion automation, or a customer portal. “Completion” is represented only by statuses managed in the UI; no end-to-end completion transaction is evidenced.

## 4. Architecture Review

### Next.js monolith with route-handler boundary

**Decision.** UI, API, authentication, and persistence adapter code reside in one Next.js App Router application. Internal pages call `/api/*` rather than importing Prisma into client components ([app](../app), [context/crm-context.tsx](../context/crm-context.tsx)).

**Apparent reason supported by evidence.** The persistence log repeatedly describes moving orchestration from pages/context into persisted API paths so that business operations are centralized and survive reloads ([docs/persistence-transition-log.md](./persistence-transition-log.md)).

**Advantages.** One deployable contains UI and API contracts; server-only database and secret access stay behind route handlers; conversion logic can use database transactions.

**Tradeoffs.** The API types are not shared as executable schemas across most routes, and pages still perform significant mutation orchestration. The monolithic `CrmProvider` also couples every authenticated page to all resource fetches ([context/crm-context.tsx](../context/crm-context.tsx)).

### Incremental persistence migration

**Decision.** The data model was added entity by entity through 19 committed migrations rather than a replacement rewrite ([prisma/migrations](../prisma/migrations), [docs/persistence-transition-log.md](./persistence-transition-log.md)).

**Advantages.** The Git and migration history provides auditable, deployable schema evolution. Existing records are explicitly preserved or de-duplicated before unique constraints are added.

**Tradeoffs.** Legacy mock datasets remain under [`data`](../data), and some documentation captures intermediate states that are now obsolete. For example, the transition log says binary storage was not implemented, while the current file route writes uploaded bytes to disk ([docs/persistence-transition-log.md](./persistence-transition-log.md), [app/api/files/route.ts](../app/api/files/route.ts)).

### Explicit entity separation

**Decision.** Intake submissions, service requests, clients, projects, quotes, invoices, tasks, notes, files, activity, and settings are distinct Prisma models ([prisma/schema.prisma](../prisma/schema.prisma)).

**Advantages.** Lifecycle stages have separate status and date fields, and uniqueness can be enforced at transition boundaries.

**Tradeoffs.** Most cross-entity links are nullable strings without foreign keys or Prisma relations. Names are denormalized into dependent records. This makes records resilient to missing parent rows but permits orphaned IDs and stale copied names.

### Atomic and idempotent conversions

**Decision.** The request-to-project conversion uses a transaction and `createMany(..., skipDuplicates)`, while database unique indexes guard three conversion paths ([app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts), [prisma/schema.prisma](../prisma/schema.prisma)).

**Advantages.** Repeated or concurrent user actions converge on a single linked record, and selected state/activity changes commit together.

**Tradeoffs.** The approach is not uniform. Quote-to-invoice performs a pre-read followed by `create`; the unique constraint prevents duplication, but a concurrent loser is handled as a generic 500 rather than reading and returning the winning invoice ([app/api/invoices/route.ts](../app/api/invoices/route.ts)). Intake-to-service-request is idempotent but status and activity updates remain orchestrated by client pages rather than one transaction ([app/(crm)/intake/page.tsx](../app/(crm)/intake/page.tsx), [app/api/service-requests/route.ts](../app/api/service-requests/route.ts)).

## 5. Data Model

| Entity | Purpose and ownership | Relationships as implemented |
| --- | --- | --- |
| `IntakeSubmission` | Captures public or owner-entered inquiry data | Unique `inquiryId`; no formal relation to requests |
| `ServiceRequest` | Represents evaluated work before project creation | Optional unique `intakeSubmissionId`; optional copied client ID/name |
| `Project` | Delivery record with status, priority, progress, and dates | Optional unique `serviceRequestId`; copied client ID/name |
| `Client` | Contact and account summary | No Prisma child relations; stores a mutable `projectCount` |
| `Task` | Project work item | Required project ID/name; optional client ID/name, without FK |
| `Note` | General, client, or project note | Optional client/project IDs, without FK |
| `FileRecord` | Metadata for uploaded or metadata-only files | Optional client/project IDs; optional server storage paths |
| `Quote` | Proposed billing record | Optional client/project IDs and copied names |
| `Invoice` | Issued/payment status record | Optional unique quote ID plus optional client/project IDs |
| `ActivityLog` | Chronological lifecycle message | Optional client/project IDs |
| `AppSettings` | Singleton business defaults | Unique key defaults to `default` |

All models are persisted in PostgreSQL through Prisma. Prisma Client is generated into `lib/generated/prisma`, and the runtime adapter uses the configured PostgreSQL connection ([prisma/schema.prisma](../prisma/schema.prisma), [prisma.config.ts](../prisma.config.ts), [lib/prisma.ts](../lib/prisma.ts)).

Ownership is application-level rather than database-level: there is no tenant or user ownership column because the current security model has one owner. Cross-entity integrity is likewise mostly application-level. Only intake/request/project/quote conversion links and settings key uniqueness are database-enforced; client, task, note, file, quote, invoice, and activity references have no foreign keys ([prisma/schema.prisma](../prisma/schema.prisma)).

Current model limitations include monetary values stored as `Float` rather than a fixed-precision database decimal, statuses stored as unrestricted strings at the database layer, copied display names that can drift, and no deletion/audit metadata. These are schema facts; the repository does not provide evidence of observed monetary rounding or integrity incidents.

## 6. API Review

### Route inventory

| Route | Methods | Responsibility |
| --- | --- | --- |
| `/api/auth/login`, `/api/auth/logout` | POST | Establish and clear owner session |
| `/api/public/intake` | POST | Signed server-to-server intake creation |
| `/api/intake` | GET, POST, PATCH | Owner intake management |
| `/api/service-requests` | GET, POST, PATCH | Request management and intake idempotency |
| `/api/service-requests/convert` | POST | Atomic request-to-project conversion |
| `/api/clients` | GET, POST, PATCH | Client management |
| `/api/projects` | GET, POST, PATCH | Project management |
| `/api/tasks`, `/api/notes`, `/api/activity` | GET, POST/PATCH as applicable | Supporting operational records |
| `/api/quotes`, `/api/invoices` | GET, POST, PATCH | Billing records and quote conversion |
| `/api/files`, `/api/files/[fileId]/download` | GET/POST, GET | Metadata, upload, and protected download |
| `/api/settings` | GET, PATCH | Singleton business settings |

All business APIs except login and public intake call `requireApiAuth` before database work. Logout does not require a session because its only effect is deleting the session cookie ([lib/auth/require-auth.ts](../lib/auth/require-auth.ts), [`app/api`](../app/api)).

Validation is strongest at the public boundary: Zod enforces types, lengths, email format, ISO time, and priority; the handler also limits the raw body to 32 KiB. Internal APIs generally cast `request.json()` to TypeScript types and perform selected presence, enum, or date checks. Because TypeScript types do not validate runtime input, internal validation coverage is inconsistent—for example, client status is allowlisted, while invoice numeric values and several PATCH statuses are accepted without equivalent schema validation ([app/api/public/intake/route.ts](../app/api/public/intake/route.ts), [app/api/clients/route.ts](../app/api/clients/route.ts), [app/api/invoices/route.ts](../app/api/invoices/route.ts)).

Error responses are generally generic and do not return stack traces. Server-side errors are written with `console.error`, while clients receive domain-level messages. Prisma “not found,” conflict, and malformed JSON errors are often collapsed into 500 responses because routes do not use a shared error translator ([app/api/clients/route.ts](../app/api/clients/route.ts), [app/api/files/route.ts](../app/api/files/route.ts)).

Separation of concerns is strongest in the conversion endpoint and public intake endpoint. Several other workflows still mix fetch orchestration, activity creation, mapping, and optimistic context updates in client pages. The transition log explicitly identifies continued migration toward atomic APIs as remaining work ([docs/persistence-transition-log.md](./persistence-transition-log.md)).

## 7. UI Review

Authenticated pages are grouped under `app/(crm)` and inherit a server layout that forces request-time rendering, authenticates, then mounts the sidebar, loading banner, and `CrmProvider`. Login remains outside that group ([app/(crm)/layout.tsx](../app/(crm)/layout.tsx), [app/login/page.tsx](../app/login/page.tsx)).

The UI uses reusable domain-neutral patterns—page headers/actions, empty states, stat cards, workspace sections/items—and Radix-backed controls under `components/ui`. Tables, dialogs, labels, inputs, selects, and buttons are shared across record pages ([components](../components), [components/ui/dialog.tsx](../components/ui/dialog.tsx)).

The dominant component boundary is client-side. The provider, sidebar, dashboard, and operational pages use `"use client"`, because they read context, manage forms/dialogs, and mutate collections. The CRM layout and root layout are server components. This boundary keeps authentication on the server, but it also causes initial page data to be fetched after hydration rather than loaded in server pages ([context/crm-context.tsx](../context/crm-context.tsx), [app/(crm)/layout.tsx](../app/(crm)/layout.tsx)).

`CrmProvider` requests all eleven resources on mount regardless of which page is open. Parallel fetches reduce latency, and mapper functions normalize API nullability, but the global loading and error model is coarse: response status is not checked before JSON parsing, partial failures are not surfaced per resource, and one context update can rerender unrelated consumers ([context/crm-context.tsx](../context/crm-context.tsx)).

Accessibility-positive evidence includes a root `lang="en"`, semantic `main`, `aside`, `nav`, native tables, explicit form labels, keyboard-capable Radix dialogs/selects, and visible focus styles in shared controls ([app/layout.tsx](../app/layout.tsx), [components/app-sidebar.tsx](../components/app-sidebar.tsx), [components/ui/input.tsx](../components/ui/input.tsx)). Confirmed limitations are that the only primary navigation is hidden below the `md` breakpoint with no mobile replacement, sidebar icon SVGs are not explicitly hidden from assistive technology, and the login error message is not an `aria-live` region ([components/app-sidebar.tsx](../components/app-sidebar.tsx), [app/login/page.tsx](../app/login/page.tsx)). A full WCAG audit or assistive-technology test was not present and was not inferred.

## 8. Security Review

### Confirmed controls

- CRM pages redirect unless authentication is configured and a signed session is valid. Protected APIs return 401 before their database operations ([lib/auth/require-auth.ts](../lib/auth/require-auth.ts)).
- Password verification supports PBKDF2 and uses timing-safe comparison. A legacy raw SHA-256 format is still accepted ([lib/auth/password.ts](../lib/auth/password.ts), [scripts/generate-password-hash.mjs](../scripts/generate-password-hash.mjs)).
- Sessions are stateless HMAC-signed tokens with expiry, `HttpOnly`, `SameSite=Lax`, path `/`, and production-only `Secure` cookies ([lib/auth/session.ts](../lib/auth/session.ts)).
- Public intake requires both a bearer key and an HMAC over timestamp plus exact body, uses timing-safe comparisons, enforces a five-minute window and 32 KiB limit, validates payloads with Zod, and handles duplicate inquiry IDs idempotently ([app/api/public/intake/route.ts](../app/api/public/intake/route.ts)).
- File download authenticates first and derives the disk path from the basename of the persisted relative path under a fixed upload directory, limiting path traversal through stored path data ([app/api/files/[fileId]/download/route.ts](../app/api/files/[fileId]/download/route.ts)).
- Environment files and local uploads are ignored by Git, and production documentation instructs operators to use a secret manager, HTTPS, restricted PostgreSQL access, and backups ([.gitignore](../.gitignore), [docs/deployment.md](./deployment.md)).

### Confirmed findings

1. **No login rate limiting or lockout.** The login route verifies every submitted password and contains no throttling, account lockout, or external rate-limit integration. Exposure depends on deployment-layer controls, for which the repository has no evidence ([app/api/auth/login/route.ts](../app/api/auth/login/route.ts)).
2. **Legacy SHA-256 password hashes are accepted.** The preferred PBKDF2 form is documented and generated by the current script, but the verifier retains a fast unsalted SHA-256 compatibility branch. Existing deployments using that form would have weaker offline-cracking resistance ([lib/auth/password.ts](../lib/auth/password.ts), [docs/auth.md](./auth.md)).
3. **Internal input validation is incomplete.** Most protected handlers rely on type assertions plus partial checks. Authentication reduces reachability but does not make malformed data safe; compromised sessions or UI defects can persist unexpected values ([app/api/invoices/route.ts](../app/api/invoices/route.ts), [app/api/intake/route.ts](../app/api/intake/route.ts)).
4. **Uploads are size-limited but not content-allowlisted or scanned.** The authenticated upload route accepts any MIME type and writes bytes to local storage. Downloads use `attachment`, which reduces inline execution risk, but malware/content policy is not implemented ([app/api/files/route.ts](../app/api/files/route.ts), [app/api/files/[fileId]/download/route.ts](../app/api/files/[fileId]/download/route.ts)).
5. **Public intake activity stores personal data in the activity message.** The message includes the submitter name. This is a persisted internal audit record rather than an unauthenticated response, but it creates an additional copy with separate retention implications ([app/api/public/intake/route.ts](../app/api/public/intake/route.ts), [prisma/schema.prisma](../prisma/schema.prisma)).
6. **Dependency audit is not clean.** `npm audit --omit=dev` on 2026-07-17 reported five moderate advisories across `next`/its `postcss` dependency and Prisma tooling dependencies. The audit output alone does not prove that the vulnerable code paths are exploitable here; remediation should be tested against supported current versions rather than applying the audit’s suggested major downgrades ([package.json](../package.json), [package-lock.json](../package-lock.json)).

### Possible improvements, not confirmed vulnerabilities

- Add deployment-aware rate limiting for login and public intake, with trusted proxy configuration and operational metrics.
- Standardize Zod schemas, request-size limits, and error mapping for internal APIs.
- Remove SHA-256 verification after confirming no deployment uses it; document password-hash rotation.
- Add an upload type policy, malware-scanning hook, retention rules, and storage abstraction before accepting untrusted files.
- Minimize personal data copied into activity messages and define retention/deletion procedures.
- Add explicit security headers, including a tested Content Security Policy. No `headers()` configuration is present in [next.config.ts](../next.config.ts), but repository evidence is insufficient to determine whether a hosting proxy already supplies these headers.

There is no evidence of authorization bypass, committed secrets, query-string credentials, or raw stack traces returned to clients. This was a static engineering review, not a penetration test.

## 9. Deployment Review

The documented production sequence is `npm ci`, Prisma generation/validation, `prisma migrate deploy`, `npm run build`, and `npm run start`. Required runtime services are a Node.js-capable host and PostgreSQL. Production HTTPS is mandatory for the session cookie ([docs/deployment.md](./deployment.md), [package.json](../package.json)).

Environment variables evidenced in code and documentation are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `CRM_AUTH_PASSWORD_HASH` | Owner credential verifier |
| `CRM_SESSION_SECRET` | Session HMAC key |
| `CRM_SESSION_COOKIE_NAME` | Optional cookie name |
| `CRM_SESSION_TTL_SECONDS` | Optional session lifetime |
| `CRM_INTAKE_API_KEY` | Public intake bearer credential |
| `CRM_SIGNING_SECRET` | Public intake HMAC key |
| `CRM_INTAKE_URL` | Website-side destination used by intake sync helper |
| `NODE_ENV` | Secure-cookie and debug-navigation behavior |

The deployment model assumes migrations can run separately from application start and that the host provides durable local storage if uploads are used. Upload bytes and PostgreSQL metadata are not committed atomically: a database failure after `writeFile` can leave an orphaned disk file. Horizontal replicas would also need shared storage because each process resolves `uploads/files` from its own working directory ([app/api/files/route.ts](../app/api/files/route.ts), [docs/deployment.md](./deployment.md)).

Production readiness is conditional rather than demonstrated. The checklist covers secrets, TLS, least-privilege database access, migrations, backups, and smoke tests, but there is no CI workflow, automated test suite, container/service definition, observability configuration, health endpoint, disaster-recovery test evidence, or rollback automation in the repository ([docs/deployment.md](./deployment.md), [package.json](../package.json)).

No Hostinger configuration, Hostinger API usage, or Hostinger-specific instructions are present. The repository supports only generic managed-host assumptions; no Hostinger conclusion can be made from available evidence.

## 10. Engineering Decisions

1. **Protect the whole workspace at a route-group layout.** `app/(crm)/layout.tsx` authenticates before rendering any CRM child and keeps `/login` outside the protected shell. This centralizes page protection ([app/(crm)/layout.tsx](../app/(crm)/layout.tsx), [docs/auth.md](./auth.md)).
2. **Use stateless single-owner sessions.** Signed cookies avoid user/session tables and match the documented one-owner scope. The cost is no identity, role, per-user revocation, or multi-user audit attribution ([lib/auth/session.ts](../lib/auth/session.ts), [docs/auth.md](./auth.md)).
3. **Put business persistence behind API routes.** Client pages call explicit APIs; conversion logic can therefore enforce database transactions and idempotency server-side ([app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts), [docs/persistence-transition-log.md](./persistence-transition-log.md)).
4. **Separate lifecycle entities.** The schema gives intake, requests, projects, quotes, and invoices independent records and statuses. This supports staged conversion and avoids one overloaded record ([prisma/schema.prisma](../prisma/schema.prisma)).
5. **Use database uniqueness as concurrency control.** Unique nullable links plus `skipDuplicates` make selected conversion operations converge under retries ([prisma/migrations](../prisma/migrations), [app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts)).
6. **Generate activity for important transitions.** Public intake and new project conversion create activity records automatically; UI operations also use a shared activity helper. This improves traceability but is not yet a complete immutable audit system ([lib/log-activity.ts](../lib/log-activity.ts), [app/api/service-requests/convert/route.ts](../app/api/service-requests/convert/route.ts)).
7. **Integrate the website through a server-to-server contract.** The public endpoint requires secrets that documentation explicitly forbids exposing to browser JavaScript. HMAC binds the timestamp and body, while the API key identifies an authorized caller ([docs/public-intake-api.md](./public-intake-api.md), [app/api/public/intake/route.ts](../app/api/public/intake/route.ts)).

Where rationale is not documented, this review describes only observable effects. In particular, there is insufficient evidence to explain why many relationships are deliberately denormalized or why `Float` was chosen for money.

## 11. Technical Debt

### High priority

| Debt | Impact | Recommended priority and evidence |
| --- | --- | --- |
| No automated tests or test script | Auth, conversion concurrency, billing, and persistence regressions rely on manual checks | Add API/integration tests first around public intake, auth, and idempotent conversions. No test files/framework or `test` script is present ([package.json](../package.json)). |
| Incomplete relational integrity | Orphaned IDs and stale copied names can accumulate; cascades and ownership cannot be enforced by PostgreSQL | Define relationship policy and migrate highest-value links incrementally ([prisma/schema.prisma](../prisma/schema.prisma)). |
| Local upload durability | Disk files can be orphaned, lost on ephemeral hosts, or unavailable across replicas | Introduce a storage abstraction and compensating cleanup before scaling deployment ([app/api/files/route.ts](../app/api/files/route.ts), [docs/deployment.md](./deployment.md)). |

### Medium priority

| Debt | Impact | Recommended priority and evidence |
| --- | --- | --- |
| Inconsistent runtime validation/error semantics | Malformed authenticated requests can produce bad data or generic 500s | Adopt shared route schemas and domain error mapping ([app/api](../app/api)). |
| Authentication is one shared credential | No roles, named actors, granular revocation, or user-attributed audit | Retain for one-owner use; design identity/RBAC only before multi-user access ([docs/auth.md](./auth.md), [prisma/schema.prisma](../prisma/schema.prisma)). |
| Global client data hydration | Every page fetches all resources and has coarse loading/failure behavior | Split data loading by page/domain or add a query cache incrementally ([context/crm-context.tsx](../context/crm-context.tsx)). |
| Conversion consistency varies | Some retries/concurrency paths return generic errors or require client orchestration | Apply the established transaction/idempotency pattern to remaining conversions ([app/api/invoices/route.ts](../app/api/invoices/route.ts), [docs/persistence-transition-log.md](./persistence-transition-log.md)). |
| Moderate dependency advisories | Known dependency risk remains unresolved | Evaluate supported Next.js/Prisma updates and verify with tests/build; do not follow downgrade-oriented automated fixes blindly ([package.json](../package.json)). |

### Low priority

| Debt | Impact | Recommended priority and evidence |
| --- | --- | --- |
| Boilerplate README | New contributors lack accurate setup and architecture entry points | Replace with project-specific setup and links to existing docs ([README.md](../README.md)). |
| Stale transition documentation | Readers may believe binary uploads are unimplemented | Mark historical snapshots and add current-state notes ([docs/persistence-transition-log.md](./persistence-transition-log.md), [app/api/files/route.ts](../app/api/files/route.ts)). |
| Legacy mock data | Increases navigation noise and ambiguity about source of truth | Confirm no runtime imports, then archive or label it; files remain under [`data`](../data). |
| Mobile navigation/accessibility gaps | Workspace navigation is unavailable at small breakpoints | Add an accessible mobile navigation using the same route model ([components/app-sidebar.tsx](../components/app-sidebar.tsx)). |

Priority reflects business-data integrity and operational risk, not evidence of active incidents.

## 12. Future Roadmap

### Planned or explicitly identified

- Continue moving remaining conversion and billing workflows to atomic, idempotent APIs ([docs/persistence-transition-log.md](./persistence-transition-log.md)).
- Manually verify file, settings, and migration behavior against a configured local PostgreSQL database ([docs/persistence-transition-log.md](./persistence-transition-log.md)).
- Add clearer success/error feedback for client updates ([docs/persistence-transition-log.md](./persistence-transition-log.md)).
- Maintain production migration, backup, authentication, and smoke-test procedures ([docs/deployment.md](./deployment.md), [docs/auth.md](./auth.md)).

### Possible, supported by current limitations

- Replace local uploads with durable shared object/file storage if deployments become ephemeral or multi-instance ([app/api/files/route.ts](../app/api/files/route.ts), [docs/deployment.md](./deployment.md)).
- Introduce named users and permissions if the audience expands beyond one owner; current documentation explicitly says those tables do not exist “yet” ([docs/auth.md](./auth.md)).
- Add per-domain loading/caching and server-side data loading to reduce the all-resource context cost ([context/crm-context.tsx](../context/crm-context.tsx)).
- Strengthen relational constraints, audit semantics, and fixed-precision billing as data volume and financial reliance increase ([prisma/schema.prisma](../prisma/schema.prisma)).

### Speculative

The repository does not contain evidence of committed plans for a customer portal, payment processor, notification service, analytics platform, mobile application, or multi-tenant SaaS product. Those ideas should remain outside the engineering roadmap until supported by product decisions and repository artifacts.

## 13. Repository Strengths

- **Clear protected/public boundary.** The authenticated route group, reusable API guard, and separately secured public intake endpoint make access intent easy to trace ([app/(crm)/layout.tsx](../app/(crm)/layout.tsx), [lib/auth/require-auth.ts](../lib/auth/require-auth.ts), [app/api/public/intake/route.ts](../app/api/public/intake/route.ts)).
- **Concrete idempotency work.** Unique indexes, migration cleanup, transactions, and duplicate-aware responses address real retry/concurrency behavior rather than relying on disabled buttons ([prisma/migrations](../prisma/migrations), [docs/persistence-transition-log.md](./persistence-transition-log.md)).
- **Typed domain surface.** Separate types and mapper functions make persisted/null-heavy payload normalization explicit at the client boundary ([types](../types), [lib/crm-record-mappers.ts](../lib/crm-record-mappers.ts)).
- **Reusable UI primitives.** Shared page patterns and Radix-backed controls reduce repeated interaction infrastructure across pages ([components](../components)).
- **Reproducible schema evolution.** Migrations cover every persistent domain addition and document duplicate cleanup before unique indexes ([prisma/migrations](../prisma/migrations)).
- **Operational documentation exists.** Authentication, public intake signing, migrations, HTTPS, least-privilege database access, backups, and smoke tests are documented with actionable commands ([docs/auth.md](./auth.md), [docs/public-intake-api.md](./public-intake-api.md), [docs/deployment.md](./deployment.md)).
- **Safe default error payloads.** Route handlers generally log server errors while returning generic client messages, avoiding stack-trace disclosure ([app/api](../app/api)).

Testing cannot be listed as a strength because no automated suite is present. Production reliability likewise cannot be claimed from build success alone.

## 14. Recommendations

### Immediate

1. Establish a regression baseline with integration tests for login/session expiry, unauthorized API access, public-intake authentication/validation/idempotency, request-to-project concurrency, and quote-to-invoice uniqueness. Make lint, tests, Prisma validation, and build required CI checks.
2. Introduce shared Zod schemas for internal create/update routes and a common error mapper for invalid JSON, validation, not-found, and unique-conflict outcomes.
3. Add login throttling at the application or trusted edge, retire legacy SHA-256 password verification after deployment verification, and document credential rotation.
4. Review the five moderate dependency advisories against supported Next.js and Prisma releases; update forward only after regression verification.
5. Update README and persistence documentation so setup, current binary upload behavior, and verification status match the code.

### Near-term

1. Apply the transactional/idempotent conversion pattern to intake-to-request and quote-to-invoice, including activity creation and retry responses.
2. Define a relational data policy. Add foreign keys and Prisma relations incrementally where orphan tolerance is not required; decide how copied names are synchronized or intentionally snapshotted.
3. Move money fields to fixed-precision decimals and centralize currency rounding/formatting before billing records become authoritative.
4. Abstract file storage, make byte/metadata persistence compensatable, add cleanup and retention, and add file-content policy controls.
5. Split global data hydration by domain/page, check HTTP status explicitly, and expose actionable partial-error states.
6. Provide accessible mobile navigation and run keyboard, screen-reader, contrast, and responsive checks across core workflows.

### Long-term

1. Add named identities, role/permission enforcement, per-actor activity attribution, and session revocation only if multi-user operation becomes a confirmed requirement.
2. Add structured logs, request correlation, health/readiness endpoints, backup-restore exercises, and deployment rollback procedures before treating the system as operationally mature.
3. Revisit modular boundaries only when scale or team ownership requires them. The current monolith is appropriate for the evidenced scope; there is no repository-supported case for a service rewrite.

These recommendations preserve the existing architecture and prioritize correctness, security, and operational confidence over feature expansion.
