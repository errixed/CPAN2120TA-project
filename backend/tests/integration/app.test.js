import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { identityService } from "../../src/modules/identity/identityService.js";
import * as leads from "../../src/modules/leads/leadService.js";
import campaigns from "../../src/modules/campaigns/campaignService.js";
import * as delivery from "../../src/modules/delivery/services/deliveryService.js";

async function createAdvisor() {
    const result = await identityService.register({
        name: "Integration Advisor",
        email: `advisor-${randomUUID()}@example.com`,
        password: "TestPassword123!",
        role: "ADVISOR"
    });

    return result.advisorProfile.id;
}

function createTestLead(advisorId, consent = true) {
    return leads.createLead({
        advisorId,
        name: "Integration Test Lead",
        email: `lead-${randomUUID()}@example.com`,
        interest: "Retirement Planning",
        status: "NEW",
        marketingConsent: consent,
        source: "MANUAL"
    });
}

async function createTestCampaign(advisorId) {
    const template = await campaigns.createTemplate({
        advisorId,
        name: "Integration Email Template",
        channel: "EMAIL",
        subject: "Retirement Planning",
        body: "Learn about retirement planning."
    });

    const campaign = await campaigns.createCampaign({
        advisorId,
        title: "Integration Campaign",
        strategy: "RETIREMENT_PLANNING",
        channel: "EMAIL",
        templateId: String(template._id),
        audience: {
            interests: ["Retirement Planning"],
            leadStatuses: ["NEW"]
        }
    });

    return { template, campaign };
}

test("Integration: create advisor, lead, template and campaign", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId);
    const { template, campaign } = await createTestCampaign(advisorId);

    assert.equal(lead.advisorId, advisorId);
    assert.equal(String(template.advisorId), advisorId);
    assert.equal(String(campaign.advisorId), advisorId);
    assert.equal(campaign.status, "DRAFT");
});

test("Integration: campaign audience includes consenting leads", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId, true);
    const { campaign } = await createTestCampaign(advisorId);

    const audience = await campaigns.getAudience({
        advisorId,
        campaignId: String(campaign._id)
    });

    assert.ok(audience.recipients.some(
        item => String(item._id) === String(lead._id)
    ));
});

test("Integration: audience excludes non-consenting leads", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId, false);
    const { campaign } = await createTestCampaign(advisorId);

    const audience = await campaigns.getAudience({
        advisorId,
        campaignId: String(campaign._id)
    });

    assert.ok(!audience.recipients.some(
        item => String(item._id) === String(lead._id)
    ));
});

test("Integration: activate campaign with eligible audience", async () => {
    const advisorId = await createAdvisor();

    createTestLead(advisorId, true);
    const { campaign } = await createTestCampaign(advisorId);

    const active = await campaigns.updateCampaign({
        advisorId,
        campaignId: String(campaign._id),
        payload: { status: "ACTIVE" }
    });

    assert.equal(active.status, "ACTIVE");
});

test("Integration: inactive campaign cannot queue delivery", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId);
    const { campaign } = await createTestCampaign(advisorId);

    await assert.rejects(
        () => delivery.queueDelivery({
            advisorId,
            campaignId: String(campaign._id),
            leadId: String(lead._id),
            channel: "EMAIL",
            content: {
                subject: "Hello",
                body: "Test message"
            }
        }),
        { statusCode: 400, code: "CAMPAIGN_NOT_ACTIVE" }
    );
});

test("Integration: queue and process a mock email", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId, true);
    const { campaign } = await createTestCampaign(advisorId);

    await campaigns.updateCampaign({
        advisorId,
        campaignId: String(campaign._id),
        payload: { status: "ACTIVE" }
    });

    const job = await delivery.queueDelivery({
        advisorId,
        campaignId: String(campaign._id),
        leadId: String(lead._id),
        channel: "EMAIL",
        content: {
            subject: "Retirement",
            body: "Your retirement planning guide."
        }
    });

    assert.equal(job.deliveryStatus, "PENDING");
    assert.equal(job.simulated, true);

    const processed = await delivery.processDelivery(job._id);

    assert.equal(processed.deliveryStatus, "SENT");
    assert.equal(processed.simulated, true);
    assert.equal(processed.attempts, 1);
    assert.match(processed.providerMessageId, /^mock-email-/);
});

test("Integration: withdrawing consent prevents processing", async () => {
    const advisorId = await createAdvisor();

    const lead = createTestLead(advisorId, true);
    const { campaign } = await createTestCampaign(advisorId);

    await campaigns.updateCampaign({
        advisorId,
        campaignId: String(campaign._id),
        payload: { status: "ACTIVE" }
    });

    const job = await delivery.queueDelivery({
        advisorId,
        campaignId: String(campaign._id),
        leadId: String(lead._id),
        channel: "EMAIL",
        content: {
            subject: "Consent Test",
            body: "Test message"
        }
    });

    leads.updateLead(String(lead._id), {
        marketingConsent: false
    });

    await assert.rejects(
        () => delivery.processDelivery(job._id),
        { statusCode: 403, code: "MARKETING_CONSENT_REQUIRED" }
    );
});
