# Lead Management — Member 2 (Deren Daniel)

Phase I provides working lead APIs without a MongoDB connection. Records are stored in process memory and disappear when the server restarts. Use fictional contacts only. These endpoints have no authentication in Phase I.

## Run and test

From `backend/`, run `npm install`, then `npm start`. The default URL is `http://localhost:3001/api/v1`.

Run `npm test` for the API tests and `node tests/validateModels.js` for the shared initial schema checks. Import `postman/leads-phase1.postman_collection.json` to try the requests manually. Run Create lead first; it saves the returned `leadId` collection variable.

## Endpoints

| Method | Path | Result |
|---|---|---|
| POST | /api/v1/leads | Create a lead; 201 |
| GET | /api/v1/leads | List/filter leads; 200 |
| GET | /api/v1/leads/:id | Read one lead; 200 |
| PATCH | /api/v1/leads/:id | Update selected fields; 200 |

Required creation fields: `advisorId` (24 hex characters), `name` (2–100 characters), `email` (valid address), and `interest` (nonempty, at most 150 characters). The sample advisor ID need not exist in Phase I.

Optional fields: `phone`, `status`, `marketingConsent`, `source`, `notes`. Names and email are trimmed; email is lowercased. Consent must be an actual JSON boolean, not a string or number. Unknown fields, null values and empty PATCH objects are rejected.

Statuses: `NEW`, `CONTACTED`, `CONSULTATION_REQUESTED`, `CONVERTED`. Default: `NEW`. Phase I validates allowed values; transition order is a Phase II responsibility.

Sources: `WEBSITE`, `FACEBOOK`, `MANUAL`, `OTHER`. Default: `MANUAL`.

Consent defaults to false. Explicit consent records a server timestamp and clears `unsubscribedAt`. Only a change from existing consent true to false sets `unsubscribedAt`, preserving the last consent timestamp. Leads who never consented keep `unsubscribedAt` null; repeated false updates preserve the original withdrawal timestamp. Clients cannot supply consent timestamps or record IDs. No marketing messages are sent by this module.

## Example

```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H 'Content-Type: application/json' \
  -d '{"advisorId":"507f1f77bcf86cd799439011","name":"Jane Example","email":"jane@example.com","interest":"Retirement planning","marketingConsent":true}'
```

A successful response contains `{ "success": true, "data": { ... } }`. Copy `data._id` for the detail and update requests. Invalid inputs return 400; a valid ID with no matching record returns 404, using the shared error envelope.

```bash
curl 'http://localhost:3001/api/v1/leads?status=NEW&marketingConsent=true&search=jane&page=1&limit=20'
```

Filters: `advisorId`, `status`, `marketingConsent=true|false`, `source`, `interest` (case-insensitive substring), `search` (case-insensitive name/email substring). Filters combine with AND. Pagination defaults to page 1, limit 20; limit is at most 100. Empty results return an empty data array. The response includes `pagination` with page, limit, total and totalPages.

## Architecture and model

`leadRoutes.js` → `leadController.js` → `leadService.js` → `leadRepository.js`. The existing `models/Lead.js` schema validates records without querying MongoDB. `advisorId` references `AdvisorProfile`; the schema includes contact information, lifecycle status, consent timestamps, source, notes and creation/update timestamps. Repository results are copied so callers cannot mutate stored records accidentally.

Phase II will replace the repository with MongoDB queries, check advisor relationships, scope access to authenticated users, handle duplicate contacts and enforce permitted lifecycle transitions. Phase III will add React directory, detail, editing and filtering screens.

## Verification

The automated HTTP tests cover creation, normalization, detail retrieval, combined filters, pagination, updates, consent withdrawal/regrant, default consent, malformed values, unknown fields, invalid IDs, 404 results, unchanged records after failed updates and the shared health route.

Implementation and tests were prepared with ChatGPT assistance. Member 2 should review the code and be able to explain its behavior before presenting it.
