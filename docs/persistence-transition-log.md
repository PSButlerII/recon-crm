# CRM Persistence Transition Log

## 2026-06-30 - Service Request to Project Conversion

### Scope

Finished the Service Request to Project persistence path for the CRM workflow:

Website Inquiry -> Intake -> Service Request -> Project -> Tasks / Notes / Activity

### Changes

- Added a transactional conversion endpoint at `app/api/service-requests/convert/route.ts`.
- Moved conversion orchestration out of client pages and into one Prisma transaction:
  - Find the service request.
  - Create or reuse the linked project.
  - Mark the service request as `Converted`.
  - Create one activity record only when a new project is created.
- Added a shared mapper module at `lib/crm-record-mappers.ts` to normalize nullable Prisma API payloads into the app's context types.
- Updated both service request pages to call `POST /api/service-requests/convert` and use the saved response for context updates.
- Added an idempotency guard to `POST /api/projects` for service-request-backed projects.
- Added a Prisma schema unique constraint for `Project.serviceRequestId`.
- Added migration `20260630230000_prevent_duplicate_service_request_projects`.

### Duplicate Handling

The migration preserves all existing project rows. If multiple projects point to the same service request, only the newest linked project keeps `serviceRequestId`; older duplicates have that field set to `NULL` before the unique index is created.

At runtime, the conversion endpoint uses `createMany` with `skipDuplicates` inside the transaction so repeated or concurrent conversion attempts converge on a single project link.

### Verification

- `.\node_modules\.bin\prisma.cmd generate` completed successfully.
- `.\node_modules\.bin\prisma.cmd migrate deploy` applied `20260630230000_prevent_duplicate_service_request_projects` to PostgreSQL database `recon_crm`.
- `npm run build` passed with the transactional conversion endpoint included.
- `npm run lint` still has unrelated pre-existing failures in other app areas, including intake, project detail, settings, and CRM context.

### Remaining Work

- Clean up unrelated lint failures so lint can become a reliable regression gate.
- Continue moving remaining mock/context-only workflows to persisted APIs.

## 2026-06-30 - Clients Persistence

### Scope

Moved the Clients module fully onto the existing PostgreSQL-backed Prisma API path.

### Changes

- Confirmed `Client` already exists in `prisma/schema.prisma` and matches the app type, including `projectCount`.
- Confirmed migration `20260522225933_add_clients` already creates the `Client` table.
- Confirmed shared CRM context initializes `clients` as `[]` and fetches clients from `/api/clients`.
- Added `PATCH /api/clients` for status and basic client field updates.
- Added client API payload validation for status and date fields.
- Added shared `mapClient` normalization for nullable Prisma API fields.
- Updated `app/clients/page.tsx` to use the saved API client via the shared mapper.
- Added a Clients page Refresh button using `refreshCrmData`.
- Kept Add Client activity logging through `logActivity` and updated activity context from the saved activity response.

### Verification

- `.\node_modules\.bin\prisma.cmd migrate status` reported the database schema is up to date.
- `npm run build` passed after the client API/page/context changes.
- `npm run lint` still has unrelated pre-existing failures in intake, project detail, settings, and CRM context.

### Remaining Work

- Add edit/status UI actions that call `PATCH /api/clients`.
