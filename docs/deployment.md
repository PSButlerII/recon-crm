# Recon CRM production deployment checklist

Use this checklist when preparing Recon CRM for a production environment. For owner authentication details, see [Owner authentication](./auth.md).

## 1. Required production environment variables

Configure these in the production host's secret manager before starting the app:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma. Use an application-specific database user with only the permissions the app needs. |
| `CRM_AUTH_PASSWORD_HASH` | Yes | Owner password hash. Generate it with `npm run auth:hash`; see [auth setup](./auth.md#generate-crm_auth_password_hash). |
| `CRM_SESSION_SECRET` | Yes | High-entropy secret used to sign HTTP-only session cookies. See [auth setup](./auth.md#generate-crm_session_secret). |
| `CRM_SESSION_COOKIE_NAME` | No | Defaults to `recon_crm_session`. Override only if the deployment needs a custom cookie name. |
| `CRM_SESSION_TTL_SECONDS` | No | Defaults to `28800` seconds (8 hours). Shorter TTLs reduce exposure from an unattended signed-in browser. |
| `CRM_INTAKE_URL` | Website only, if public website intake is enabled | Full CRM public intake URL used by the website server-side submit handler. |
| `CRM_INTAKE_API_KEY` | Yes, if public website intake is enabled | Bearer token for `POST /api/public/intake`; see [public intake API](./public-intake-api.md). |
| `CRM_SIGNING_SECRET` | Yes, if public website intake is enabled | HMAC signing secret for public intake requests; see [public intake API](./public-intake-api.md). |
| `NODE_ENV` | Yes | Set to `production` for production builds/servers. This also hides the Debug navigation item. |

Do not commit production secret values to the repository.

## 2. PostgreSQL and `DATABASE_URL` setup

- Provision a PostgreSQL database before deploying the app.
- Use TLS/SSL for database connections when the database is not on the same private network as the app.
- Create a dedicated database user for Recon CRM instead of using a superuser.
- Restrict inbound PostgreSQL access to the app host, private network, or managed connection proxy.
- Do **not** expose PostgreSQL directly to the public internet.
- Store the final connection string as `DATABASE_URL` in the deployment platform's secret manager.

## 3. Owner auth setup

Generate the owner password hash locally or in a trusted shell:

```bash
npm run auth:hash
```

Copy the full `pbkdf2:<iterations>:<salt>:<hash>` output into `CRM_AUTH_PASSWORD_HASH`.

Generate the session signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `CRM_SESSION_SECRET`.

For more detail, including session TTL and cookie notes, see [docs/auth.md](./auth.md).

## 4. Prisma migration and client commands

Run these after dependencies are installed and before starting the production server:

```bash
npx prisma generate
npx prisma validate
npx prisma migrate deploy
```

Notes:

- `npx prisma migrate deploy` applies committed migrations in production/server environments.
- Use `npx prisma migrate dev` only for local development when creating or testing new migrations.
- If you have direct database access and want to inspect migration state, run `npx prisma migrate status` from a trusted local/server shell with `DATABASE_URL` configured.
- Keep migration SQL files committed so production deploys are reproducible.

## 5. Build and start commands

Install dependencies, generate Prisma artifacts, apply migrations, build, then start:

```bash
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate deploy
npm run build
npm run start
```

For managed platforms, map these commands to the platform's build/release/start phases. A typical split is:

- Build phase: `npm ci && npx prisma generate && npx prisma validate && npm run build`
- Release/migration phase: `npx prisma migrate deploy`
- Start phase: `npm run start`

## 6. HTTPS expectation

Production must serve Recon CRM over HTTPS. Session cookies are marked `Secure` when `NODE_ENV=production`, so browsers will only send them over HTTPS. If HTTPS is terminated at a reverse proxy or load balancer, ensure the app receives the correct forwarded protocol headers for the hosting platform.

## 7. Backup notes

Back up all production data needed to restore the CRM:

- PostgreSQL database: schedule automated backups and test restore procedures periodically.
- Prisma migrations: keep committed migration files in source control and deploy from tagged releases.
- Uploaded files: local uploads are stored under the server-side `uploads/` directory by default; back up that directory along with PostgreSQL metadata.
- Secrets: keep production secrets in the host's secret manager and document the recovery/rotation process outside the repository.

Before major migrations, take an on-demand PostgreSQL backup and verify that rollback/redeploy steps are understood.

## 8. Production smoke test

After deployment:

1. Visit `/login` and confirm the login page renders without the CRM sidebar.
2. Visit `/` while logged out and confirm it redirects to `/login`.
3. Sign in with the owner password and confirm the dashboard loads.
4. Request a protected API route while logged out, such as `/api/clients`, and confirm it returns `401` JSON.
5. Confirm the Debug navigation item is not visible in the production sidebar.
6. Create or update a low-risk CRM record and confirm it persists after refresh.
7. Click **Logout** and confirm the app returns to `/login`.
