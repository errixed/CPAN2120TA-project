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
3. The user's credentials are stored securely.
4. The user signs in using valid credentials.
5. The backend generates a JSON Web Token (JWT).
6. The application uses the token to access protected resources.
7. Unauthorized requests are rejected.

### 4.2 Marketing Campaign Workflow

1. An authorized advisor creates a marketing campaign.
2. The advisor enters the campaign title, description, marketing strategy, and target audience.
3. The backend validates the submitted information.
4. The campaign is saved to the database.
5. The advisor selects the communication channel.
6. The delivery module queues eligible marketing messages or publishes approved Facebook Page content.
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
4. The system schedules the configured action.
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
| Frontend | React |
| Database | MongoDB |
| Database modeling | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Email integration | Gmail SMTP with Nodemailer |
| Facebook integration | Meta Graph API |
| API testing | Postman |
| Version control | Git and GitHub |
| Package manager | npm |

The backend follows a layered architecture:

**Route → Controller → Service → Repository → Mongoose Model → MongoDB**

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

## 9. Development Setup

### Backend

Navigate to the backend directory:

```bash
cd backend
npm install
npm run dev
```

The backend uses `src/config.js` for centralized application configuration. Sensitive configuration values must be supplied through environment variables and must not be committed to GitHub.

The default development server port is `3001`.

Once running, the health endpoint can be accessed at:

`http://localhost:3001/api/v1/health`

### Frontend

The frontend will be initialized and implemented during Phase III using React.

### Database

MongoDB integration will be implemented during Phase II using Mongoose.

## 10. Current Development Status

**Current Phase: Phase I — Backend Foundation**

The initial backend directory structure has been created, including the five business modules and placeholder files for the eight planned database models.

The shared Express application, central configuration, health endpoint, error-handling middleware, and request logging middleware have been prepared.

The remaining Phase I tasks include completing the initial Mongoose schemas, implementing the business API routes, and verifying repository initialization and team contributions.

**Note:** Creating empty model or route files does not constitute implementing the corresponding data models or APIs.

## 11. Project Scope and Limitations

FinMarket-Enterprise is an educational project intended to demonstrate full-stack web development, marketing automation, database management, security, and third-party API integration.

The system will use fictional or explicitly authorized demonstration data.

The application will not process financial transactions, provide automated investment recommendations, or manage real investment portfolios.

Email marketing functionality will respect provider sending restrictions and applicable consent requirements.

Facebook integration will be limited to supported operations available through authorized Meta API permissions.

External service integrations may initially use mock implementations while real credentials, permissions, or provider approvals are unavailable.

## 12. Expected Project Outcome

The completed FinMarket-Enterprise platform should demonstrate how a financial advisory business can manage prospective clients, organize campaigns, automate marketing communications, and monitor client acquisition activities through one centralized web application.

The primary measure of success will be a functional end-to-end business workflow in which an advisor creates a campaign, selects eligible leads, initiates an authorized marketing action, records the result, and reviews the corresponding activity through the application.

The project will also demonstrate RESTful API design, data relationships, secure authentication, backend-enforced authorization, frontend integration, and deployment.

## 13. ChatGPT Use Acknowledgement

ChatGPT (OpenAI) was used to generate and structure this `README.md` based on the following project documents:

- `Project_Specification_Document.pdf`
- `FinMarket-Enterprise_Team_Project_Guide.pdf`

Both documents are located in the `/docs/projectSpecification/` directory.

ChatGPT assisted with organizing the project overview, business case definition, proposed functionality, technical architecture, development phases, and team responsibilities into a structured README.

The generated content was based on the provided project specifications and the team's proposed application requirements.