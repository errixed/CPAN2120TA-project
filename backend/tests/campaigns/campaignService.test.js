import assert from "node:assert/strict";
import { test, before } from "node:test";
import { createCampaignService } from "../../src/modules/campaigns/campaignService.js";
import { randomUUID } from "node:crypto";
import { identityService } from "../../src/modules/identity/identityService.js";

let advisorId;

before(async () => {
    const result = await identityService.register({
        name: "Campaign Test Advisor",
        email: `campaign-${randomUUID()}@example.com`,
        password: "TestPassword123!",
        role: "ADVISOR"
    });

    advisorId = result.advisorProfile.id;
});
const campaignId = "507f1f77bcf86cd799439012";
const templateId = "507f1f77bcf86cd799439013";
const futureDate = new Date(Date.now() + 60_000);

function makeCampaign(overrides = {}) {
    return {
        _id: campaignId,
        advisorId,
        title: "Retirement planning",
        description: "",
        strategy: "RETIREMENT_PLANNING",
        channel: "EMAIL",
        audience: { interests: [], leadStatuses: [] },
        templateId: null,
        status: "DRAFT",
        scheduledAt: null,
        completedAt: null,
        ...overrides
    };
}

function makeRepository(overrides = {}) {
    const repository = {
        createCampaign: async (data) => ({ _id: campaignId, ...data }),
        listCampaigns: async () => [],
        findCampaign: async () => makeCampaign(),
        updateCampaign: async ({ changes }) => ({ ...makeCampaign(), ...changes }),
        listTemplates: async () => [],
        findTemplate: async () => ({ _id: templateId, channel: "EMAIL" }),
        findAudience: async () => [{ _id: "507f1f77bcf86cd799439014" }]
    };

    return { ...repository, ...overrides };
}

test("creates campaigns with normalized default audience criteria", async () => {
    const repository = makeRepository();
    const service = createCampaignService(repository);
    const campaign = await service.createCampaign({
        advisorId,
        title: "Retirement planning",
        strategy: "RETIREMENT_PLANNING",
        channel: "EMAIL",
        audience: { interests: [" Retirement ", "Retirement"], leadStatuses: ["NEW"] }
    });

    assert.equal(campaign.status, "DRAFT");
    assert.deepEqual(campaign.audience, {
        interests: ["Retirement"],
        leadStatuses: ["NEW"]
    });
});

test("rejects unsupported strategies and invalid audience statuses", async () => {
    const service = createCampaignService(makeRepository());
    const base = {
        advisorId,
        title: "Retirement planning",
        strategy: "RETIREMENT_PLANNING",
        channel: "EMAIL"
    };

    await assert.rejects(
        service.createCampaign({ ...base, strategy: "UNSUPPORTED" }),
        /strategy is not supported/
    );
    await assert.rejects(
        service.createCampaign({
            ...base,
            audience: { leadStatuses: ["UNSUPPORTED"] }
        }),
        /unsupported lead status/
    );
});

test("requires a future date to schedule a campaign", async () => {
    const service = createCampaignService(makeRepository());

    await assert.rejects(
        service.createCampaign({
            advisorId,
            title: "Scheduled campaign",
            strategy: "NEWSLETTER",
            channel: "EMAIL",
            status: "SCHEDULED"
        }),
        /future scheduledAt/
    );

    const campaign = await service.createCampaign({
        advisorId,
        title: "Scheduled campaign",
        strategy: "NEWSLETTER",
        channel: "EMAIL",
        status: "SCHEDULED",
        scheduledAt: futureDate
    });
    assert.equal(campaign.status, "SCHEDULED");
});

test("activation requires an advisor-owned template matching the channel", async () => {
    const mismatch = createCampaignService(makeRepository({
        findTemplate: async () => ({ _id: templateId, channel: "FACEBOOK" })
    }));

    await assert.rejects(
        mismatch.createCampaign({
            advisorId,
            title: "Email campaign",
            strategy: "NEWSLETTER",
            channel: "EMAIL",
            templateId,
            status: "ACTIVE"
        }),
        /template channel must match/
    );
});

test("activation requires eligible audience members and records completion", async () => {
    const emptyAudience = createCampaignService(makeRepository({
        findAudience: async () => []
    }));

    await assert.rejects(
        emptyAudience.createCampaign({
            advisorId,
            title: "Email campaign",
            strategy: "NEWSLETTER",
            channel: "EMAIL",
            templateId,
            status: "ACTIVE"
        }),
        /at least one consenting, subscribed lead/
    );

    const service = createCampaignService(makeRepository({
        findCampaign: async () => makeCampaign({
            status: "ACTIVE",
            templateId
        })
    }));
    const completed = await service.updateCampaign({
        advisorId,
        campaignId,
        payload: { status: "COMPLETED" }
    });

    assert.equal(completed.status, "COMPLETED");
    assert.ok(completed.completedAt instanceof Date);
});

test("campaign updates cannot change advisor ownership or revive terminal campaigns", async () => {
    const terminal = createCampaignService(makeRepository({
        findCampaign: async () => makeCampaign({ status: "CANCELLED" })
    }));

    await assert.rejects(
        terminal.updateCampaign({
            advisorId,
            campaignId,
            payload: { status: "ACTIVE" }
        }),
        /cannot transition from CANCELLED/
    );
    await assert.rejects(
        terminal.updateCampaign({
            advisorId,
            campaignId,
            payload: { advisorId: "507f1f77bcf86cd799439015" }
        }),
        /Unsupported field/
    );
});

test("active campaigns cannot lose their template or all eligible leads", async () => {
    const service = createCampaignService(makeRepository({
        findCampaign: async () => makeCampaign({
            status: "ACTIVE",
            templateId
        }),
        findAudience: async () => []
    }));

    await assert.rejects(
        service.updateCampaign({
            advisorId,
            campaignId,
            payload: { templateId: null }
        }),
        /active template/
    );
    await assert.rejects(
        service.updateCampaign({
            advisorId,
            campaignId,
            payload: { audience: { interests: ["No matching interest"] } }
        }),
        /at least one consenting, subscribed lead/
    );
});

test("audience preview returns only the campaign's matching leads", async () => {
    const audience = [{ _id: "507f1f77bcf86cd799439014", email: "member@example.com" }];
    let query;
    const service = createCampaignService(makeRepository({
        findCampaign: async () => makeCampaign({
            audience: { interests: ["Retirement"], leadStatuses: ["NEW"] }
        }),
        findAudience: async (filter) => {
            query = filter;
            return audience;
        }
    }));

    const result = await service.getAudience({ advisorId, campaignId });
    assert.deepEqual(query, {
        advisorId,
        interests: ["Retirement"],
        leadStatuses: ["NEW"]
    });
    assert.equal(result.count, 1);
    assert.deepEqual(result.recipients, audience);
});
