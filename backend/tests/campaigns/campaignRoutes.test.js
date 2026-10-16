import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import errorHandler from "../../src/middleware/errorHandler.js";
import { createCampaignRouter } from "../../src/modules/campaigns/campaignRoutes.js";

test("campaign routes return the documented success envelope", async (context) => {
    const advisorId = "507f1f77bcf86cd799439011";
    const service = {
        createCampaign: async (data) => ({ _id: "campaign-1", ...data }),
        listCampaigns: async ({ status }) => [{ _id: "campaign-1", status }],
        getCampaign: async () => ({ _id: "campaign-1" }),
        updateCampaign: async ({ payload }) => ({ _id: "campaign-1", ...payload }),
        getAudience: async () => ({ campaignId: "campaign-1", count: 0, recipients: [] }),
        listTemplates: async ({ channel }) => [{ name: "Welcome", channel }],
        getTemplate: async () => ({ name: "Welcome" })
    };
    const app = express();
    app.use(express.json());
    app.use("/api/v1/campaigns", createCampaignRouter(service));
    app.use(errorHandler);

    const server = app.listen(0);
    context.after(() => new Promise((resolve) => server.close(resolve)));
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/campaigns`;

    const createdResponse = await fetch(baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            advisorId,
            title: "Retirement planning",
            strategy: "RETIREMENT_PLANNING",
            channel: "EMAIL"
        })
    });
    assert.equal(createdResponse.status, 201);
    assert.deepEqual(await createdResponse.json(), {
        success: true,
        data: {
            _id: "campaign-1",
            advisorId,
            title: "Retirement planning",
            strategy: "RETIREMENT_PLANNING",
            channel: "EMAIL"
        }
    });

    const templatesResponse = await fetch(
        `${baseUrl}/templates?advisorId=${advisorId}&channel=EMAIL`
    );
    assert.equal(templatesResponse.status, 200);
    assert.deepEqual(await templatesResponse.json(), {
        success: true,
        data: [{ name: "Welcome", channel: "EMAIL" }]
    });

    const campaignsResponse = await fetch(
        `${baseUrl}?advisorId=${advisorId}&status=DRAFT`
    );
    assert.deepEqual(await campaignsResponse.json(), {
        success: true,
        data: [{ _id: "campaign-1", status: "DRAFT" }]
    });
});

test("campaign routes return structured errors when advisorId is missing", async (context) => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/campaigns", createCampaignRouter({
        listTemplates: async () => []
    }));
    app.use(errorHandler);

    const server = app.listen(0);
    context.after(() => new Promise((resolve) => server.close(resolve)));
    await once(server, "listening");

    const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/v1/campaigns/templates`
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        success: false,
        error: {
            code: "ADVISOR_ID_REQUIRED",
            message: "advisorId is required."
        }
    });
});
