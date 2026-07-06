# Public website intake API

External websites can submit lead/intake requests to Recon CRM through `POST /api/public/intake`. This route is public only in the sense that it does not require the owner session cookie; every request must include both a bearer API key and an HMAC signature.

The internal CRM admin route `/api/intake` remains protected by owner authentication and should not be used by public websites.

## Required environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `CRM_INTAKE_URL` | Website only | Full CRM endpoint URL, for example `https://crm.example.com/api/public/intake`. |
| `CRM_INTAKE_API_KEY` | Yes | Shared bearer token used by the website when calling the public intake endpoint. |
| `CRM_SIGNING_SECRET` | Yes | Shared HMAC secret used to sign the timestamp and raw JSON request body. |

Store these values in the CRM host and in the trusted website/server that sends submissions. Do not expose them in browser JavaScript, and do not call this endpoint directly from client-side form code.

## Endpoint

```http
POST /api/public/intake
Content-Type: application/json
Authorization: Bearer <CRM_INTAKE_API_KEY>
X-Recon-Timestamp: <unix_seconds>
X-Recon-Signature: <hex_hmac_sha256>
```

## Signing format

1. Serialize the JSON payload exactly as it will be sent in the request body.
2. Generate a Unix timestamp in seconds.
3. Create the signing string:

```text
<timestamp>.<raw_json_body>
```

4. Compute lowercase hex HMAC-SHA256 with `CRM_SIGNING_SECRET`.
5. Send the timestamp as `X-Recon-Timestamp` and the hex digest as `X-Recon-Signature`.

Requests outside the 5-minute replay window are rejected.

## Payload

Required fields:

- `inquiryId`
- `source`
- `name`
- `email`
- `phone`
- `projectType`
- `goal`

Optional fields:

- `company`
- `blocker`
- `budget`
- `timeline`
- `preferredContact`
- `message`
- `submittedAt` (ISO datetime; defaults to server receive time)
- `priority` (`low`, `normal`, `high`, `urgent`; defaults to `normal`)

Payloads over 32 KB are rejected. Duplicate `inquiryId` submissions are treated idempotently and return `duplicate: true`.

## Sample payload

```json
{
  "inquiryId": "website-2026-07-02-001",
  "source": "recon-dev-website",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+1 555 0100",
  "company": "Example Co",
  "projectType": "CRM automation",
  "goal": "I need a workflow to track service requests and invoices.",
  "budget": "$5k-$10k",
  "timeline": "This quarter",
  "preferredContact": "email",
  "message": "Please follow up next week.",
  "submittedAt": "2026-07-02T12:00:00.000Z",
  "priority": "normal"
}
```

## Sample Node fetch request

```js
import { createHmac } from "node:crypto";

const apiKey = process.env.CRM_INTAKE_API_KEY;
const signingSecret = process.env.CRM_SIGNING_SECRET;
const payload = {
  inquiryId: "website-2026-07-02-001",
  source: "recon-dev-website",
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+1 555 0100",
  projectType: "CRM automation",
  goal: "I need a workflow to track service requests and invoices.",
};
const body = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = createHmac("sha256", signingSecret)
  .update(`${timestamp}.${body}`)
  .digest("hex");

const response = await fetch(process.env.CRM_INTAKE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Recon-Timestamp": timestamp,
    "X-Recon-Signature": signature,
  },
  body,
});

console.log(response.status, await response.json());
```

## Sample curl request

```bash
body='{"inquiryId":"website-2026-07-02-001","source":"recon-dev-website","name":"Ada Lovelace","email":"ada@example.com","phone":"+1 555 0100","projectType":"CRM automation","goal":"I need a workflow to track service requests and invoices."}'
timestamp=$(date +%s)
signature=$(printf '%s.%s' "$timestamp" "$body" | openssl dgst -sha256 -hmac "$CRM_SIGNING_SECRET" -hex | awk '{print $2}')

curl -X POST 'https://crm.example.com/api/public/intake' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CRM_INTAKE_API_KEY" \
  -H "X-Recon-Timestamp: $timestamp" \
  -H "X-Recon-Signature: $signature" \
  --data "$body"
```

## Sample PowerShell request

```powershell
$ApiKey = $env:CRM_INTAKE_API_KEY
$SigningSecret = $env:CRM_SIGNING_SECRET
$Body = '{"inquiryId":"website-2026-07-02-001","source":"recon-dev-website","name":"Ada Lovelace","email":"ada@example.com","phone":"+1 555 0100","projectType":"CRM automation","goal":"I need a workflow to track service requests and invoices."}'
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$SigningString = "$Timestamp.$Body"
$Hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($SigningSecret))
$Hash = $Hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($SigningString))
$Signature = -join ($Hash | ForEach-Object { $_.ToString('x2') })

Invoke-RestMethod -Method Post -Uri 'https://crm.example.com/api/public/intake' `
  -ContentType 'application/json' `
  -Headers @{
    Authorization = "Bearer $ApiKey"
    'X-Recon-Timestamp' = $Timestamp
    'X-Recon-Signature' = $Signature
  } `
  -Body $Body
```

## Responses

Success:

```json
{ "ok": true, "duplicate": false, "intakeId": "..." }
```

Duplicate `inquiryId`:

```json
{ "ok": true, "duplicate": true, "intakeId": "..." }
```

Unauthorized, invalid signatures, invalid payloads, oversized payloads, and server errors return safe JSON with an `error` string and do not expose protected CRM data.
