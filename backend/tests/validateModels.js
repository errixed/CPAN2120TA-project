import mongoose from "mongoose";
import User from "../src/modules/identity/models/User.js";
import AdvisorProfile from "../src/modules/identity/models/AdvisorProfile.js";
import Lead from "../src/modules/leads/models/Lead.js";
import Campaign from "../src/modules/campaigns/models/Campaign.js";
import Template from "../src/modules/campaigns/models/Template.js";
import DeliveryJob from "../src/modules/delivery/models/DeliveryJob.js";
import AutomationRule from "../src/modules/automation/models/AutomationRule.js";
import ActivityEvent from "../src/modules/automation/models/ActivityEvent.js";

const id = new mongoose.Types.ObjectId();

const cases = [
    {
        model: User,
        data: {
            name: "Test Advisor",
            email: "advisor@example.com",
            passwordHash: "example-hash-for-testing",
            role: "ADVISOR"
        }
    },
    {
        model: AdvisorProfile,
        data: {
            userId: id,
            specialties: ["Retirement Planning"],
            consultationTypes: ["ONLINE"]
        }
    },
    {
        model: Lead,
        data: {
            advisorId: id,
            name: "John Smith",
            email: "john@example.com",
            interest: "Retirement Planning"
        }
    },
    {
        model: Campaign,
        data: {
            advisorId: id,
            title: "Retirement Planning Campaign",
            strategy: "RETIREMENT_PLANNING",
            channel: "EMAIL"
        }
    },
    {
        model: Template,
        data: {
            advisorId: id,
            name: "Welcome Email",
            channel: "EMAIL",
            subject: "Welcome",
            body: "Thank you for your interest."
        }
    },
    {
        model: DeliveryJob,
        data: {
            advisorId: id,
            campaignId: id,
            leadId: id,
            channel: "EMAIL",
            recipientEmail: "john@example.com",
            content: {
                subject: "Welcome",
                body: "Thank you for your interest."
            }
        }
    },
    {
        model: AutomationRule,
        data: {
            ownerId: id,
            name: "New Lead Welcome",
            trigger: "LEAD_CREATED",
            action: "SEND_EMAIL"
        }
    },
    {
        model: ActivityEvent,
        data: {
            eventId: "event-001",
            eventType: "LEAD_CREATED",
            entityId: id,
            entityType: "LEAD",
            ownerId: id
        }
    }
];

let failed = 0;

for (const { model, data } of cases) {
    const document = new model(data);
    try {
        await document.validate();
        console.log(`PASS: ${model.modelName}`);
    } catch (error) {
        failed++;
        console.error(`FAIL: ${model.modelName}`);
        console.error(error.message);
    }
}

console.log(
    `Validation completed: ${cases.length - failed}/${cases.length} passed`
);

if (failed > 0) {
    process.exitCode = 1;
}