# Campaigns and templates

The campaigns module provides advisor-scoped campaign CRUD, active-template lookup, and an audience preview. Campaigns and templates are persisted in MongoDB through their Mongoose models.

## Run the feature

1. Start MongoDB and set `MONGO_URI` in the environment (for example, `mongodb://127.0.0.1:27017/finmarket`).
2. From `backend/`, run `npm start`. The API is available at `http://localhost:3001/api/v1`.
3. Add campaign records through the API. Templates are read-only from this module and must already exist in the `templates` collection.
4. From `frontend/`, run `npm install` once and then `npm run dev`. Set `VITE_API_URL` to override the default API URL.
5. Open the frontend and enter the advisor profile's MongoDB ObjectId.

Until the identity module supplies authenticated advisor context, the endpoints accept an explicit `advisorId` query parameter (or the JSON body when creating a campaign) so teammates can test with sample profile IDs. All lookups and mutations are scoped to that profile ID; this value is not a substitute for authentication in a deployed application.

If MongoDB is not connected, campaign endpoints return `503 DATABASE_UNAVAILABLE`; the health endpoint remains available.

For an isolated API demo, seed one active template and a consenting lead for the same sample advisor ID. In a local `mongosh` session, replace the IDs below if needed:

```javascript
const advisorId = ObjectId("507f1f77bcf86cd799439011");

db.templates.insertOne({
  advisorId,
  name: "Retirement planning introduction",
  channel: "EMAIL",
  subject: "Planning for the retirement you want",
  body: "Learn the key steps to prepare for retirement.",
  isActive: true
});

db.leads.insertOne({
  advisorId,
  name: "Demo Member",
  email: "demo-member@example.com",
  interest: "Retirement Planning",
  status: "NEW",
  marketingConsent: true,
  unsubscribedAt: null
});
```

## Endpoints

All successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/campaigns` | Create a draft or scheduled campaign |
| `GET` | `/api/v1/campaigns?advisorId=<id>&status=DRAFT` | List campaigns; status is optional |
| `GET` | `/api/v1/campaigns/:campaignId?advisorId=<id>` | Retrieve one campaign |
| `PATCH` | `/api/v1/campaigns/:campaignId?advisorId=<id>` | Update campaign fields or status |
| `GET` | `/api/v1/campaigns/:campaignId/audience?advisorId=<id>` | Preview matching eligible leads |
| `GET` | `/api/v1/campaigns/templates?advisorId=<id>&channel=EMAIL` | List active templates; channel is optional |
| `GET` | `/api/v1/campaigns/templates/:templateId?advisorId=<id>` | Retrieve one active template |

Create example:

```sh
curl -X POST http://localhost:3001/api/v1/campaigns \
  -H 'content-type: application/json' \
  -d '{
    "advisorId": "507f1f77bcf86cd799439011",
    "title": "Retirement planning series",
    "description": "A practical introduction to retirement planning.",
    "strategy": "RETIREMENT_PLANNING",
    "channel": "EMAIL",
    "audience": {
      "interests": ["Retirement Planning"],
      "leadStatuses": ["NEW", "CONTACTED"]
    }
  }'
```

Example result:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "advisorId": "507f1f77bcf86cd799439011",
    "title": "Retirement planning series",
    "description": "A practical introduction to retirement planning.",
    "strategy": "RETIREMENT_PLANNING",
    "channel": "EMAIL",
    "audience": {
      "interests": ["Retirement Planning"],
      "leadStatuses": ["NEW", "CONTACTED"]
    },
    "templateId": null,
    "status": "DRAFT",
    "scheduledAt": null,
    "completedAt": null,
    "createdAt": "2026-10-14T17:00:00.000Z",
    "updatedAt": "2026-10-14T17:00:00.000Z"
  }
}
```

## Business rules

- Strategies: `NEWSLETTER`, `RETIREMENT_PLANNING`, `INVESTMENT_EDUCATION`, `WEBINAR`, `CONSULTATION_OFFER`, `OTHER`.
- Status transitions: `DRAFT → SCHEDULED | ACTIVE | CANCELLED`; `SCHEDULED → DRAFT | ACTIVE | CANCELLED`; `ACTIVE → COMPLETED | CANCELLED`. `COMPLETED` and `CANCELLED` are terminal. A scheduled campaign requires a future `scheduledAt`.
- Activating a campaign requires an active template owned by the same advisor and matching the campaign channel, plus at least one eligible lead.
- Audience filters match the campaign's selected lead interests and statuses. Every channel excludes leads without marketing consent and leads with `unsubscribedAt` set.
- Updating campaign ownership is not supported. Campaigns and templates are always queried using both the record ID and advisor ID.
- Templates are intentionally retrieved, not created or edited, by these endpoints.
