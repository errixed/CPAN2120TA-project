# FinMarket-Enterprise

**Financial Advisory Marketing and Client Acquisition Platform**

## 1. Project Overview

FinMarket-Enterprise is a full-stack web application designed to help financial advisory businesses automate marketing activities, manage prospective clients, and improve client acquisition.

The platform provides a centralized environment where financial advisors and marketing specialists can manage marketing campaigns, organize prospective clients, automate email communications, publish promotional content to authorized Facebook Pages, and monitor marketing performance.

The project focuses on reducing repetitive manual marketing tasks while improving operational efficiency, communication consistency, and lead management.

## 2. Business Case Definition

### 2.1 Business Problem

Marketing is an essential part of operating a financial advisory business. Financial advisors must regularly promote their services, communicate with potential clients, organize marketing campaigns, and follow up with interested prospects.

However, many of these activities are performed manually or through separate applications.

For example, a financial advisor may maintain contact information in spreadsheets, prepare promotional emails individually, publish marketing content on social media, and manually track client responses.

This approach creates several operational challenges:

- **Time-consuming processes:** Repetitive activities such as sending marketing emails and scheduling follow-ups require manual effort.
- **Fragmented information:** Client information, marketing campaigns, and communication history may be stored across different systems.
- **Missed opportunities:** Without automated reminders and follow-ups, potential clients may not receive timely communication.
- **Limited performance tracking:** Advisors may struggle to determine which marketing campaigns generate interest or lead to consultations.
- **Inconsistent marketing:** Manually managing campaigns across multiple communication channels increases the risk of inconsistent messaging.

These challenges demonstrate the need for a centralized marketing automation and client acquisition platform.

### 2.2 Proposed Solution

FinMarket-Enterprise will provide a centralized web application that allows financial advisory businesses to manage marketing activities through a single platform.

The application will support:

1. **User and Advisor Management:** Create user accounts, manage advisor profiles, and assign access permissions.
2. **Lead Management:** Register prospective clients, maintain contact information, and track lead status.
3. **Marketing Campaign Management:** Create marketing campaigns, define target audiences, and manage reusable promotional templates.
4. **Email and Facebook Marketing:** Send authorized bulk marketing emails using Gmail SMTP and publish text-based promotional posts to authorized Facebook Pages through the Meta Graph API.
5. **Marketing Automation:** Configure rule-based actions that respond to business events, such as new leads or consultation requests.
6. **Marketing Analytics:** Monitor campaign activity, delivery results, lead status, and conversion performance.

By combining these capabilities, the platform aims to reduce manual marketing work and improve the process of attracting and converting prospective clients.

### 2.3 Business Objectives

The primary objectives of FinMarket-Enterprise are to:

- Automate repetitive marketing activities.
- Centralize lead and marketing campaign information.
- Improve communication between financial advisors and prospective clients.
- Support organized and timely follow-ups.
- Enable marketing activities across email and Facebook.
- Track potential clients through the acquisition process.
- Provide campaign performance information through a centralized dashboard.
- Protect business data through authentication, authorization, and backend validation.

### 2.4 Target Users and Access Roles

FinMarket-Enterprise will support three primary user roles.

| User Role | Responsibilities |
|---|---|
| Administrator | Manage user accounts, advisor access, platform permissions, and administrative settings. |
| Financial Advisor | Manage professional profiles, prospective clients, marketing campaigns, and consultation activities. |
| Marketing Specialist | Prepare marketing campaigns, manage approved promotional content, schedule communications, and monitor campaign results. |

Access permissions will be enforced by the backend rather than relying only on frontend restrictions.

For example, a marketing specialist may be permitted to prepare campaign content but must not automatically receive permission to modify administrator accounts.

## 3. Core Business Modules

### 3.1 Identity and Advisor Management

This module manages user registration, authentication, roles, and financial advisor profiles.

Financial advisors will be able to maintain professional information, including specialties and available consultation types.

Administrators will be responsible for managing user access and ensuring that restricted operations are available only to authorized users.

### 3.2 Lead Management (CRM)

The Lead Management module provides a centralized system for organizing prospective clients.

A lead represents an individual who may be interested in receiving financial advisory services.

The module will support creating, retrieving, updating, searching, and filtering lead records.

Each lead may progress through the following lifecycle:

**NEW → CONTACTED → CONSULTATION_REQUESTED → CONVERTED**

Marketing consent will also be recorded to determine whether a lead is eligible to receive promotional emails.

### 3.3 Marketing Campaign Management

Financial advisors and authorized marketing specialists will be able to create and manage marketing campaigns.

Supported marketing strategies may include:

- Retirement planning promotions.
- Investment education campaigns.
- Financial planning webinars.
- Insurance awareness campaigns.
- Consultation invitations.
- Informational newsletters.

Each campaign will contain relevant information such as its title, description, target audience, associated advisor, and status.

Reusable message templates will help maintain consistency across marketing communications.

### 3.4 Email and Facebook Delivery

This module is responsible for delivering marketing communications through supported channels.

**Email marketing:** The platform will integrate Gmail SMTP using Nodemailer to send authorized marketing emails to eligible recipients. Email delivery will support basic queuing, rate limiting, and delivery tracking.

**Facebook marketing:** The platform will use the Meta Graph API to publish text-based promotional posts to authorized Facebook Pages, subject to the necessary access permissions and approval.

Delivery records will allow authorized users to review successful and failed marketing operations.

### 3.5 Marketing Automation and Analytics

The Marketing Automation module will execute predefined actions when supported business events occur.

For example, when a new lead is registered, an automation rule may schedule a welcome email.

When a prospective client requests a consultation, another rule may schedule a follow-up notification.

The analytics functionality will summarize relevant business information, including:

- Number of registered leads.
- Number of active campaigns.
- Marketing delivery results.
- Consultation requests.
- Lead conversion rates.

## 4. Business Workflows

### 4.1 User Authentication Workflow

1. A user creates an account.
2. The backend validates the registration information.
3. In Phase I, the backend hashes passwords using Node.js `scrypt` and stores records temporarily in memory.
4. The user signs in using valid credentials.
5. **Planned for Phase II:** the backend issues JWTs, protects sensitive API routes, and enforces role-based access using trusted server-side identity. Phase I login does not issue a JWT.

### 4.2 Marketing Campaign Workflow

1. An authorized advisor creates a marketing campaign.
2. The advisor enters the campaign title, description, marketing strategy, and target audience.
3. The backend validates the submitted information.
4. In Phase I, the campaign is saved in the in-memory repository; MongoDB persistence is planned for Phase II.
5. The advisor selects the communication channel.
6. The Phase I delivery module queues eligible jobs and simulates sending through a mock provider. Real Gmail/Facebook integrations are planned for later phases, subject to permissions.
7. The system records the delivery or publishing results.

### 4.3 Lead Management Workflow

1. An advisor registers a prospective client.
2. The backend validates the lead information.
3. The lead is assigned the initial status `NEW`.
4. The advisor contacts the lead and updates its status to `CONTACTED`.
5. If the lead requests a consultation, the status changes to `CONSULTATION_REQUESTED`.
6. When the lead successfully becomes a client, the status changes to `CONVERTED`.

The backend validates status changes to prevent unsupported values and unauthorized modifications.

### 4.4 Marketing Automation Workflow

1. A business event occurs, such as the registration of a new lead.
2. The application identifies automation rules associated with the event.
3. The backend verifies that the rule is enabled and its conditions are satisfied.
4. In Phase I, the system **simulates** the configured action. Actual scheduling and execution are planned for later phases.
5. For email marketing, recipient consent must be verified before sending.
6. The application records the automation result.
7. The analytics module uses recorded activity to generate performance summaries.

## 5. Business Rules and Data Requirements

The completed application must enforce the following proposed business rules:

1. User registration requires valid information, and passwords must be securely hashed.
2. Access to protected resources requires successful authentication.
3. Users may perform only operations permitted by their roles.
4. A lead must contain valid required contact information.
5. Marketing emails must not be sent to recipients without the required marketing consent or to recipients who have unsubscribed.
6. Campaigns must contain valid required information before they can be activated.
7. Marketing delivery results must be recorded for tracking and reporting.
8. Automation rules must execute only when their configured conditions are satisfied.
9. Invalid requests must produce structured error responses.
10. Data changes must be stored persistently using MongoDB.

The application will use MongoDB collections to store related business information.

The proposed initial collections are:

| Collection | Purpose |
|---|---|
| `users` | User accounts, credentials, and roles |
| `advisorProfiles` | Financial advisor profiles and specialties |
| `leads` | Prospective client information and acquisition status |
| `campaigns` | Marketing campaign information |
| `templates` | Reusable marketing message templates |
| `deliveryJobs` | Email and Facebook publishing jobs and results |
| `automationRules` | Marketing automation triggers and actions |
| `activityEvents` | Business events used for automation and analytics |

Relationships between these collections will allow the system to associate leads, campaigns, and marketing activities with the appropriate users and advisors.

## 6. Technology Stack

| Component | Technology |
|---|---|
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Programming language | JavaScript (ES6 modules) |
| Frontend | React (planned for Phase III) |
| Database | MongoDB (Phase II); temporary in-memory repositories in Phase I |
| Database modeling | Mongoose |
| Authentication | Phase I: scrypt password hashing and mock-session login; Phase II: JWT and backend authorization |
| Email integration | Phase I mock provider; Gmail SMTP planned for later phase |
| Facebook integration | Phase I mock provider; Meta Graph API integration planned subject to permissions |
| API testing | Postman |
| Version control | Git and GitHub |
| Package manager | npm |

The backend follows a layered architecture:

**Phase I: Route → Controller → Service → In-memory Repository (with Mongoose schema validation)**  
**Phase II target: Route → Controller → Service → MongoDB-backed Repository → Mongoose → MongoDB**

This separation allows each component to focus on a specific responsibility and makes development, testing, and maintenance more manageable.

## 7. Project Development Phases

The project will be completed in three phases according to the course specification.

### Phase I — Backend Foundation

- Business case definition.
- Backend project setup.
- Core API routes.
- Initial data models.
- GitHub repository initialization.

**Objective:** Establish the backend foundation and define the structure required for future implementation.

### Phase II — Database and Security Integration

- MongoDB integration using Mongoose.
- Authentication and authorization implementation.
- Role-based access enforcement.
- Secure data handling.

**Objective:** Integrate persistent data storage and enforce security and business rules through the backend.

### Phase III — Frontend Integration and Deployment

- React frontend integration.
- Full-stack connectivity.
- Deployment to a hosting platform.
- Production environment configuration.

**Objective:** Deliver an integrated, functional, and deployed full-stack application.

## 8. Team Responsibilities

Development is divided into five business modules so team members can work independently while following shared API contracts and architectural conventions.

| Member | Assigned Module | Primary Responsibility |
|---|---|---|
| Member 1 | Identity and Advisors | User accounts, authentication, roles, and advisor profiles |
| Member 2 | Lead Management | Prospective clients, lead lifecycle, and CRM |
| Member 3 | Marketing Campaigns | Campaign creation, marketing strategies, and templates |
| Member 4 | Marketing Delivery | Gmail SMTP, Facebook Page publishing, and delivery tracking |
| Member 5 | Automation and Analytics | Event-driven automation, follow-ups, and reporting |

Each member is responsible for the backend functionality, database integration, frontend components, and testing associated with their assigned module as the project progresses.

Shared components will be coordinated to maintain consistent integration between modules.

## 8.1 Getting Started — Backend (Phase I)

**Prerequisites:** Node.js and npm installed, a terminal, and a local copy of this repository. Run commands from the repository root unless stated otherwise.

```bash
cd backend
npm start
```

When `npm start` is executed, the `prestart` script automatically:

1. Checks whether backend dependencies are installed and installs them if necessary.
2. Executes `tests/validateModels.js` to validate all eight initial Mongoose models.
3. Starts the Express server only if all model validations pass.

The validation script uses Mongoose schema validation without requiring a MongoDB connection. If any model fails validation, the startup process stops and displays the corresponding error.

Expected validation result:

```text
Validation completed: 8/8 passed
```

This ensures that the initial data models meet their schema requirements before the backend starts.

`npm start` runs `node src/server.js`. The `prestart` script attempts `npm ci` automatically **only if `backend/node_modules` is absent**. On a fresh clone, or whenever dependencies are missing/outdated, the most reliable setup is:

```bash
cd backend
npm ci
npm start
```

For development with automatic restarts, run `npm run dev` (install dependencies first). Default address: `http://localhost:3001`. Check the server using:

```bash
curl http://localhost:3001/api/v1/health
```

Expected: HTTP 200 and JSON with `success: true` and `data.status: "OK"`. Stop the server with `Ctrl+C`. Use a current Node.js release compatible with the versions of Express and Mongoose recorded in `backend/package-lock.json`.

### Environment configuration

The backend reads environment variables in `backend/src/config.js`; Phase I does **not** require a MongoDB connection, JWT token, Gmail credentials, or Meta credentials. Variables are read from the process environment; the code does not automatically load a `.env` file with `dotenv`.

| Variable | Default / purpose | Phase I required? |
|---|---|---|
| `PORT` | `3001` — HTTP port | No |
| `NODE_ENV` | `development` — application environment | No |
| `CORS_ORIGIN` | Configured allowed frontend origin; can be overridden when the frontend is implemented | No |
| `MONGO_URI` | Unset — reserved for MongoDB integration. If supplied, the server attempts to connect. | **No — leave unset** |
| `JWT_SECRET` | Unset — intended for Phase II JWT support | No |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Unset — planned email integration | No |
| `META_ACCESS_TOKEN`, `META_PAGE_ID` | Unset — planned authorized Facebook Page integration | No |

Example macOS/Linux overrides:

```bash
cd backend
PORT=3002 npm start
```

Do not commit passwords, tokens, or live third-party credentials. In-memory data is cleared each time the backend process restarts. Although the project defines eight Mongoose schemas, the Phase I repositories do not persist application records to MongoDB.

### Frontend (Phase III)

The React frontend and its integration with the backend are planned for Phase III. **No frontend development server or frontend startup command is required to run or test the Phase I backend.** Start the backend with `cd backend` followed by `npm start` and use the API endpoints or Postman for Phase I verification.

### Testing

From `backend/`, run:

```bash
npm test
```

The latest reported run (October 15, 2026) passed **55/55 Node.js automated tests**. Coverage includes Identity, Leads, Campaigns, Delivery, Automation, and cross-module integration. Node's built-in `node:test` runner is used; tests do not require MongoDB.

A consolidated Postman Collection v2.1 contains **157 requests** across setup, all five modules, integration/regression, validation, and diagnostic folders. On the latest observed run of the original collection, **601/603 assertions passed**; the remaining two reflected one Delivery ownership error-contract mismatch. The corrected collection expects `400 ADVISOR_MISMATCH` rather than `404 CAMPAIGN_NOT_FOUND` for that scenario, but its corrected rerun has **not** been confirmed here. Import `FinMarket-Enterprise_Complete_Phase1_Corrected.postman_collection.json` into Postman after adding that generated file to your project; this file is **not included in the inspected ZIP**. Set `baseUrl` to `http://localhost:3001/api/v1`, start the backend, use 1 iteration, and run the collection sequentially. Rebooting the backend before a complete run clears test data.

**Known quality note:** Mongoose 9 prints a deprecation warning for `Document.prototype.validateSync()`; it does not currently fail the test suite. Migration to asynchronous `validate()` will require changes to callers.

**Current implementation status:** Phase I backend routes, schema validation, in-memory records, mock email/social delivery, and simulated automation events are implemented. JWT authorization, database persistence, real external delivery, complete frontend integration, and production deployment remain Phase II/III goals.

## 9. Project Scope and Limitations

FinMarket-Enterprise is an educational project intended to demonstrate full-stack web development, marketing automation, database management, security, and third-party API integration.

The system will use fictional or explicitly authorized demonstration data.

The application will not process financial transactions, provide automated investment recommendations, or manage real investment portfolios.

Email marketing functionality will respect provider sending restrictions and applicable consent requirements.

Facebook integration will be limited to supported operations available through authorized Meta API permissions.

External service integrations may initially use mock implementations while real credentials, permissions, or provider approvals are unavailable.

## 10. Initial Data Models

FinMarket-Enterprise uses Mongoose schemas to define the structure, validation rules, and relationships of its MongoDB collections.

The initial database design contains eight collections:

| Model | Purpose | Relationships |
|---|---|---|
| User | Authentication and role management | Referenced by AdvisorProfile and AutomationRule |
| AdvisorProfile | Financial advisor information | References User |
| Lead | Prospect and client acquisition management | References AdvisorProfile |
| Campaign | Marketing campaign management | References AdvisorProfile and optionally Template |
| Template | Reusable email and Facebook marketing content | References AdvisorProfile |
| DeliveryJob | Email delivery and Facebook publishing tracking | References Campaign and optionally Lead |
| AutomationRule | Rule-based marketing automation | References User and optionally Campaign |
| ActivityEvent | Business event history and analytics | Identifies related entities through entityType and entityId |

Each model defines appropriate field types, required values, defaults, and validation constraints. Relevant fields also have indexes to support future database queries.

The models are maintained in the `models/` directory of their respective backend modules.

**Phase I:** Define the Mongoose schemas and test their initial validation behavior.

**Phase II:** Integrate the schemas with MongoDB, implement persistent storage, enforce relationships, and apply backend security and authorization rules.

## 11. Expected Project Outcome

The completed FinMarket-Enterprise platform should demonstrate how a financial advisory business can manage prospective clients, organize campaigns, automate marketing communications, and monitor client acquisition activities through one centralized web application.

The primary measure of success will be a functional end-to-end business workflow in which an advisor creates a campaign, selects eligible leads, initiates an authorized marketing action, records the result, and reviews the corresponding activity through the application.

The project will also demonstrate RESTful API design, data relationships, secure authentication, backend-enforced authorization, frontend integration, and deployment.

## 12. Campaign Management API and Business Rules

The Campaigns module supports campaign creation, retrieval, updates, reusable marketing templates, and audience selection. During Phase I, campaigns and templates are stored temporarily in memory using JavaScript Maps. Mongoose schemas provide data validation without requiring a MongoDB connection.

All campaign operations are scoped to an advisor using `advisorId`. During Phase I, this identifier is provided explicitly through the request body or query parameters. Backend-enforced authentication and authorization will be implemented in Phase II.

### 12.1 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/campaigns` | Create a campaign |
| GET | `/api/v1/campaigns` | List campaigns |
| GET | `/api/v1/campaigns/:campaignId` | Retrieve a specific campaign |
| PATCH | `/api/v1/campaigns/:campaignId` | Update campaign information or status |
| GET | `/api/v1/campaigns/:campaignId/audience` | Preview eligible campaign recipients |
| POST | `/api/v1/campaigns/templates` | Create a reusable template |
| GET | `/api/v1/campaigns/templates` | List active templates |
| GET | `/api/v1/campaigns/templates/:templateId` | Retrieve a specific active template |

GET and PATCH operations require an `advisorId` query parameter. POST requests accept the advisor ID in the JSON body.

Successful responses follow the structure `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

### 12.2 Campaign Strategies

Supported campaign strategies include:

- `NEWSLETTER`
- `RETIREMENT_PLANNING`
- `INVESTMENT_EDUCATION`
- `WEBINAR`
- `CONSULTATION_OFFER`
- `OTHER`

### 12.3 Campaign Status Transitions

Campaigns follow a controlled lifecycle:

| Current Status | Allowed Next Statuses |
|---|---|
| DRAFT | SCHEDULED, ACTIVE, CANCELLED |
| SCHEDULED | DRAFT, ACTIVE, CANCELLED |
| ACTIVE | COMPLETED, CANCELLED |
| COMPLETED | None |
| CANCELLED | None |

A scheduled campaign must have a future `scheduledAt` value.

### 12.4 Business Rules

1. Campaigns must belong to an existing advisor profile.
2. Campaigns must reference an active template belonging to the same advisor before activation.
3. The selected template channel must match the campaign channel.
4. Campaign activation requires at least one eligible lead.
5. Campaign audiences are filtered according to selected interests and lead statuses.
6. Leads without marketing consent or with a recorded unsubscribe date are excluded.
7. Campaign ownership cannot be modified through the standard update endpoint.
8. Campaign and template records are retrieved using both their identifiers and the associated advisor ID.

### 12.5 Example — Create a Campaign

**Request:** `POST /api/v1/campaigns`

```json
{
  "advisorId": "507f1f77bcf86cd799439011",
  "title": "Retirement Planning Campaign",
  "description": "A practical introduction to retirement planning.",
  "strategy": "RETIREMENT_PLANNING",
  "channel": "EMAIL",
  "audience": {
    "interests": ["Retirement Planning"],
    "leadStatuses": ["NEW", "CONTACTED"]
  }
}
```

The example `advisorId` is illustrative. An actual advisor profile must exist in the Identity module before this request can succeed.

A successful request returns HTTP `201 Created` with a generated campaign ID.

### 12.6 Phase I Limitations

Campaign and template records are stored in memory and are cleared whenever the backend process restarts.

Mongoose models are retained for schema validation and future database integration. MongoDB persistence, JWT authentication, and backend role-based authorization are planned for Phase II.

## 13. Full Phase I REST API Documentation

### 13.1 General API conventions

- **Base URL:** `http://localhost:3001/api/v1` (or your configured `PORT`).
- **Requests:** `Content-Type: application/json` for JSON bodies.
- **Successful response:** generally `{ "success": true, "data": ... }`. Some list routes additionally return `count`; the Leads list provides pagination metadata.
- **Error response:** generally `{ "success": false, "error": { "code": "...", "message": "..." } }`; some validation paths may use a generic error code. Use the response status and message as well as any error code.
- **Common statuses:** `200` success, `201` created, `400` invalid request, `401` failed login, `403` forbidden by a business rule, `404` missing record, `409` conflict/invalid transition, `500` unexpected failure.
- **IDs:** MongoDB ObjectId-shaped 24-character hexadecimal strings. Create referenced records first; illustrative IDs alone are not sufficient.
- **Phase I trust boundary:** advisors/owners are provided in request bodies or query strings. These are **not authenticated claims**. Do not describe Phase I APIs as security-protected; trusted identity, JWT, and enforced roles belong to Phase II.

### 13.2 Health and Identity & Advisors

| Method | Route | Inputs | Behavior / result |
|---|---|---|---|
| GET | `/health` | None | Health/status and timestamp; `200` |
| POST | `/auth/register` | JSON: `name`, `email`, `password`, `role`; optional `profile` | Creates user and, for advisor role, profile; `201`. Rejects duplicates/invalid input. |
| POST | `/auth/login` | JSON: `email`, `password` | Verifies credentials; `200`, or `401` on invalid credentials. **Does not issue JWT in Phase I.** |
| GET | `/advisors` | None | Public advisor directory; `200` |
| GET | `/advisors/:id` | URL: advisor ID | Advisor details; `200` or `404` |
| PATCH | `/advisors/:id` | JSON: supported profile fields such as `specialties`, `consultationTypes`, `bio`, `isPublic` | Updates advisor profile; `200`; rejects unsupported values or protected identity fields. |

Example registration:

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Demo Advisor",
  "email": "demo-advisor@example.com",
  "password": "ExamplePass123!",
  "role": "ADVISOR"
}
```

Save the returned **advisor profile ID** for Leads, Campaigns, and Delivery; save the returned **user ID** separately for Automation `ownerId`. The two identifiers are not interchangeable.

### 13.3 Leads CRM

| Method | Route | Inputs | Behavior / result |
|---|---|---|---|
| POST | `/leads` | JSON: `advisorId`, `name`, `email`, `interest`; optional `phone`, `status`, `marketingConsent`, `source`, `notes` | Creates a lead; `201`. Advisor must exist. Default marketing consent is false. |
| GET | `/leads` | Optional query: `advisorId`, `status`, `marketingConsent`, `source`, `interest`, `search`, `page`, `limit` | Filter/search/paginate; `200`. `page` starts at 1 and `limit` is at most 100. |
| GET | `/leads/:id` | Lead ID | Retrieve record; `200` or `404` |
| PATCH | `/leads/:id` | JSON: supported editable lead fields | Update and validate lead, tracking consent withdrawal; `200` |

Example:

```json
{
  "advisorId": "<existing-advisor-profile-id>",
  "name": "Jane Example",
  "email": "jane@example.com",
  "interest": "Retirement Planning",
  "status": "NEW",
  "marketingConsent": true,
  "source": "MANUAL"
}
```

Use the actual ID returned by registration rather than the placeholder above. Lead email duplicates are checked within an advisor's records, and consent withdrawal prevents pending email deliveries from being processed.

### 13.4 Campaigns and reusable templates

| Method | Route | Inputs | Behavior / result |
|---|---|---|---|
| POST | `/campaigns` | JSON: `advisorId`, `title`, `strategy`, `channel`; optional `description`, `audience`, `templateId`, scheduling fields | Create draft campaign; `201` |
| GET | `/campaigns` | Required `advisorId`; optional `status` | List advisor-owned campaigns; `200` |
| GET | `/campaigns/:campaignId` | Required query `advisorId` | Retrieve campaign; `200` |
| PATCH | `/campaigns/:campaignId` | Required query `advisorId`; JSON changes including status | Update fields or transition state; `200` |
| GET | `/campaigns/:campaignId/audience` | Required query `advisorId` | Preview matching consenting, subscribed leads; `200` |
| POST | `/campaigns/templates` | JSON: `advisorId`, `name`, `channel`, `body`; `subject` as applicable | Create reusable template; `201` |
| GET | `/campaigns/templates` | Required `advisorId`; optional `channel` | List active templates; `200` |
| GET | `/campaigns/templates/:templateId` | Required query `advisorId` | Retrieve owned active template; `200` |

Campaign `strategy`: `NEWSLETTER`, `RETIREMENT_PLANNING`, `INVESTMENT_EDUCATION`, `WEBINAR`, `CONSULTATION_OFFER`, `OTHER`. Lifecycle: `DRAFT → SCHEDULED/ACTIVE/CANCELLED`; `SCHEDULED → DRAFT/ACTIVE/CANCELLED`; `ACTIVE → COMPLETED/CANCELLED`; completed and cancelled states are terminal. Activation requires an appropriate active template belonging to the advisor and at least one consenting eligible lead. For full examples and business rules see Section 12.

### 13.5 Marketing Delivery (mock provider)

| Method | Route | Inputs | Behavior / result |
|---|---|---|---|
| POST | `/deliveries` | JSON: `advisorId`, `campaignId`, `channel`, `content`; email jobs additionally require `leadId`; optional `recipientEmail`, `scheduledAt` | Validate and queue simulated job; `201`, status `PENDING` |
| GET | `/deliveries` | Optional filters `campaignId`, `deliveryStatus` | Delivery history; `200` |
| POST | `/deliveries/:id/process` | URL job ID, empty body | Explicitly process due PENDING job through mock provider; `200`, status `SENT` or `FAILED` |

Example email job (IDs must refer to an existing **ACTIVE** campaign and one of its eligible leads):

```json
{
  "advisorId": "<existing-advisor-profile-id>",
  "campaignId": "<existing-active-campaign-id>",
  "leadId": "<existing-consenting-lead-id>",
  "channel": "EMAIL",
  "content": {
    "subject": "Planning Your Retirement",
    "body": "Find out more about our retirement planning consultation."
  }
}
```

Delivery validates the campaign's owner and channel, audience membership, recipient agreement, and marketing consent. Queueing a job **does not send it**. Processing checks that it is due, rechecks relevant eligibility, and moves the job through `PENDING → PROCESSING → SENT/FAILED`. Duplicate pending jobs are rejected; already processed jobs cannot be processed again. `simulated: true` and a mock message ID are **not evidence of real-world email delivery or Facebook publication**. A 400 `ADVISOR_MISMATCH` may be returned for mismatched lead/campaign ownership.

### 13.6 Automation & Analytics (simulated)

| Method | Route | Inputs | Behavior / result |
|---|---|---|---|
| POST | `/automations` | JSON: `ownerId`, `name`, `trigger`, `action`; optional `description`, `campaignId`, `delayMinutes`, `enabled` | Create automation rule; `201`. `ownerId` must reference an existing **user**. |
| GET | `/automations` | Optional filters: `ownerId`, `trigger`, `action`, `enabled` | List matching rules; `200` |
| POST | `/automations/simulate-event` | JSON: optional `eventId`, `eventType`, `entityType`, `entityId`, `ownerId`, `metadata` | Record an event and return **simulated** actions; `201`, or `409` for duplicate event ID |
| GET | `/automations/events` | Optional filters: `eventType`, `ownerId`, `entityId` | List event history; `200` |
| GET | `/analytics/summary` | None | Counts of rules, events, and simulated actions; `200` |

Example create rule:

```json
{
  "ownerId": "<existing-user-id>",
  "name": "Welcome newly registered leads",
  "trigger": "LEAD_CREATED",
  "action": "SEND_EMAIL",
  "enabled": true,
  "delayMinutes": 0
}
```

Example simulated event:

```json
{
  "eventId": "demo-event-001",
  "eventType": "LEAD_CREATED",
  "entityType": "LEAD",
  "entityId": "<existing-lead-id>",
  "ownerId": "<existing-user-id>",
  "metadata": {}
}
```

`eventId` must be unique for each simulated execution. Automation actions are **not automatically connected to real email sending** in Phase I. Full trigger execution, scheduling and persistent event processing are future-phase goals. Schema enum values for triggers/actions and event types are defined in `backend/src/modules/automation/models/` and should be consulted when extending the API.

### 13.7 Recommended end-to-end demonstration

1. Register an ADVISOR; save its user ID and advisor profile ID.
2. Create a consenting Lead for the advisor.
3. Create an EMAIL template and a draft Campaign referencing that template with an audience matching the lead.
4. Activate the Campaign and preview its audience.
5. Queue an EMAIL delivery; verify `PENDING`, then call `/deliveries/:id/process` and verify `SENT` with `simulated: true`.
6. Create an Automation rule using the user ID, simulate a `LEAD_CREATED` event, then retrieve events and `/analytics/summary`.
7. Withdraw the lead's marketing consent and confirm that new email delivery/processing attempts are blocked.

These are **Phase I demonstration flows**, not claims of real-world sending, authenticated authorization, or persisted data.

## 14. Project Status, Verification, and Planned Work

| Area | Phase I status | Next work |
|---|---|---|
| Express API and five feature modules | Implemented and locally tested | Broader regression/quality checks |
| Mongoose schema definitions | Present; used for validation | MongoDB storage, indexes and migrations |
| Identity | In-memory users/profiles, scrypt password hashing, login validation | JWT issuance, authorization middleware, role enforcement |
| Leads | In-memory CRUD, filtering, status and consent rules | Persistent CRM and access controls |
| Campaigns/Templates | In-memory CRUD, status transitions, audience previews | Persistent campaigns, authenticated ownership |
| Delivery | In-memory queue and explicit mock processing | Reliable queue/retries, authorized SMTP/Meta APIs |
| Automation/Analytics | Rules, events, simulated actions and counts | Durable triggers, scheduling and execution |
| Frontend | Planned for Phase III; not required for Phase I | Full React integration and security-aware screens |
| Deployment | Local development only | Hosting, production configuration and verification |

**Verification evidence (latest provided):** 55/55 Node tests passed on October 15, 2026. The initial 157-request Postman collection run reported 601/603 passing assertions in approximately 2.5 seconds, with two expected-error mismatches for a single foreign-lead delivery scenario. The collection has since been corrected, but a full rerun of the corrected collection is not yet independently confirmed. Avoid stating that all Postman tests passed without the corrected run output.

## 15. ChatGPT Use Acknowledgement

OpenAI ChatGPT was used as a development and documentation assistance tool during the Phase I work, including:

1. **README/business case generation and revision:** ChatGPT generated and organized the `README.md` business case using the *Course Project Specification Document: Modern Web Technologies* and the *FinMarket-Enterprise Team Project Guide*, including the business problem, user roles, workflows, architecture, phase boundaries, setup, and API descriptions.
2. **Postman collection generation:** ChatGPT generated a consolidated Phase I Postman collection with 157 API requests and automated response assertions. It also revised two assertions after a test run showed that the backend returned `400 ADVISOR_MISMATCH` for a cross-advisor Delivery scenario instead of the initially expected `404 CAMPAIGN_NOT_FOUND`.
3. **Automated test generation:** ChatGPT generated or helped revise Node.js `node:test` unit and cross-module integration tests covering Identity, Leads, Campaigns, Delivery, Automation, and business-rule validations. The latest local test run reported 55 of 55 passing tests.
4. **Code review and debugging assistance:** ChatGPT helped identify inconsistencies across modules, improve input and ownership checks, review status transitions and simulated delivery processing, and interpret test failures. Suggested modifications were incorporated into the working implementation by the development team.

**Human responsibility:** Team members are responsible for reviewing, understanding, adapting, implementing, and validating all generated content and code. ChatGPT suggestions are not a substitute for source-code review, executable testing, or demonstration of individual understanding. This acknowledgement describes assistance rather than assigning project authorship to ChatGPT; final submitted work and contributions must comply with the course's academic integrity requirements.

**Project reference documents:** *Project Specification Document* and *FinMarket-Enterprise Team Project Guide* (provided with the project).