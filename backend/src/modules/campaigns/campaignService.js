import mongoose from "mongoose";
import * as repository from "./campaignRepository.js";

export const CAMPAIGN_STRATEGIES = Object.freeze([
    "NEWSLETTER",
    "RETIREMENT_PLANNING",
    "INVESTMENT_EDUCATION",
    "WEBINAR",
    "CONSULTATION_OFFER",
    "OTHER"
]);

export const CAMPAIGN_STATUSES = Object.freeze([
    "DRAFT",
    "SCHEDULED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED"
]);

const LEAD_STATUSES = new Set([
    "NEW",
    "CONTACTED",
    "CONSULTATION_REQUESTED",
    "CONVERTED"
]);
const CHANNELS = new Set(["EMAIL", "FACEBOOK"]);
const MUTABLE_FIELDS = new Set([
    "title",
    "description",
    "strategy",
    "channel",
    "audience",
    "templateId",
    "status",
    "scheduledAt"
]);
const CREATABLE_FIELDS = new Set(["advisorId", ...MUTABLE_FIELDS]);
const STATUS_TRANSITIONS = Object.freeze({
    DRAFT: new Set(["DRAFT", "SCHEDULED", "ACTIVE", "CANCELLED"]),
    SCHEDULED: new Set(["DRAFT", "SCHEDULED", "ACTIVE", "CANCELLED"]),
    ACTIVE: new Set(["ACTIVE", "COMPLETED", "CANCELLED"]),
    COMPLETED: new Set(["COMPLETED"]),
    CANCELLED: new Set(["CANCELLED"])
});

function fail(message, statusCode = 400, code = "INVALID_REQUEST") {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    throw error;
}

function requireObjectId(value, fieldName) {
    if (!mongoose.isValidObjectId(value)) {
        fail(`${fieldName} must be a valid MongoDB ObjectId.`);
    }

    return value;
}

function validateFields(payload, allowedFields) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        fail("The request body must be a JSON object.");
    }

    const unknownFields = Object.keys(payload)
        .filter((field) => !allowedFields.has(field));

    if (unknownFields.length > 0) {
        fail(`Unsupported field(s): ${unknownFields.join(", ")}.`);
    }
}

function normalizeAudience(audience = {}) {
    if (!audience || typeof audience !== "object" || Array.isArray(audience)) {
        fail("audience must be an object.");
    }

    const unsupportedFields = Object.keys(audience)
        .filter((field) => !["interests", "leadStatuses"].includes(field));

    if (unsupportedFields.length > 0) {
        fail(`Unsupported audience field(s): ${unsupportedFields.join(", ")}.`);
    }

    const interests = audience.interests ?? [];
    const leadStatuses = audience.leadStatuses ?? [];

    if (!Array.isArray(interests) ||
        interests.some((interest) => typeof interest !== "string")) {
        fail("audience.interests must be an array of strings.");
    }

    if (!Array.isArray(leadStatuses) ||
        leadStatuses.some((status) => typeof status !== "string" ||
            !LEAD_STATUSES.has(status))) {
        fail("audience.leadStatuses contains an unsupported lead status.");
    }

    return {
        interests: [...new Set(interests.map((value) => value.trim()).filter(Boolean))],
        leadStatuses: [...new Set(leadStatuses)]
    };
}

function normalizeDate(value, fieldName) {
    if (value === null || value === "") {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        fail(`${fieldName} must be a valid date.`);
    }

    return date;
}

function normalizeCampaignFields(payload, { create = false } = {}) {
    const result = { ...payload };

    if (Object.hasOwn(result, "audience")) {
        result.audience = normalizeAudience(result.audience);
    }

    if (Object.hasOwn(result, "scheduledAt")) {
        result.scheduledAt = normalizeDate(result.scheduledAt, "scheduledAt");
    }

    if (Object.hasOwn(result, "templateId")) {
        result.templateId = result.templateId
            ? requireObjectId(result.templateId, "templateId")
            : null;
    }

    if (Object.hasOwn(result, "strategy") &&
        !CAMPAIGN_STRATEGIES.includes(result.strategy)) {
        fail("strategy is not supported.");
    }

    if (Object.hasOwn(result, "channel") && !CHANNELS.has(result.channel)) {
        fail("channel is not supported.");
    }

    if (Object.hasOwn(result, "status") &&
        !CAMPAIGN_STATUSES.includes(result.status)) {
        fail("status is not supported.");
    }

    if (create) {
        result.advisorId = requireObjectId(result.advisorId, "advisorId");
    }

    return result;
}

async function validateTemplate(campaign, repo) {
    if (!campaign.templateId) {
        fail("Select an active template before activating the campaign.");
    }

    const template = await repo.findTemplate({
        advisorId: campaign.advisorId,
        templateId: campaign.templateId
    });

    if (!template) {
        fail("The selected template was not found for this advisor.", 404, "TEMPLATE_NOT_FOUND");
    }

    if (template.channel !== campaign.channel) {
        fail("The selected template channel must match the campaign channel.");
    }
}

async function validateActiveCampaign(campaign, repo) {
    await validateTemplate(campaign, repo);
    const audience = await repo.findAudience({
        advisorId: campaign.advisorId,
        interests: campaign.audience.interests,
        leadStatuses: campaign.audience.leadStatuses
    });

    if (audience.length === 0) {
        fail("A campaign needs at least one consenting, subscribed lead before activation.");
    }
}

async function validateStatusChange(previous, next, repo) {
    if (!STATUS_TRANSITIONS[previous].has(next.status)) {
        fail(`A campaign cannot transition from ${previous} to ${next.status}.`);
    }

    if (next.status === "SCHEDULED" &&
        (!next.scheduledAt || next.scheduledAt <= new Date())) {
        fail("A scheduled campaign must have a future scheduledAt date.");
    }

    if (next.status === "ACTIVE" && previous !== "ACTIVE") {
        await validateActiveCampaign(next, repo);
    }
}

function asPlainObject(value) {
    return typeof value.toObject === "function" ? value.toObject() : value;
}

export function createCampaignService(repo = repository) {
    return {
        async createCampaign(payload) {
            validateFields(payload, CREATABLE_FIELDS);
            const data = normalizeCampaignFields(payload, { create: true });
            const desiredStatus = data.status ?? "DRAFT";
            data.status = "DRAFT";
            data.audience = normalizeAudience(data.audience);

            if (desiredStatus !== "DRAFT") {
                const proposed = { ...data, status: desiredStatus };
                await validateStatusChange("DRAFT", proposed, repo);
                data.status = desiredStatus;
                data.completedAt = desiredStatus === "COMPLETED" ? new Date() : null;
            }

            if (data.templateId) {
                await validateTemplate(data, repo);
            }

            return repo.createCampaign(data);
        },

        async listCampaigns({ advisorId, status }) {
            requireObjectId(advisorId, "advisorId");
            if (status && !CAMPAIGN_STATUSES.includes(status)) {
                fail("status is not supported.");
            }

            return repo.listCampaigns({ advisorId, status });
        },

        async getCampaign({ advisorId, campaignId }) {
            requireObjectId(advisorId, "advisorId");
            requireObjectId(campaignId, "campaignId");
            const campaign = await repo.findCampaign({ advisorId, campaignId });

            if (!campaign) {
                fail("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
            }

            return campaign;
        },

        async updateCampaign({ advisorId, campaignId, payload }) {
            requireObjectId(advisorId, "advisorId");
            requireObjectId(campaignId, "campaignId");
            validateFields(payload, MUTABLE_FIELDS);

            if (Object.keys(payload).length === 0) {
                fail("Provide at least one campaign field to update.");
            }

            const current = await repo.findCampaign({ advisorId, campaignId });
            if (!current) {
                fail("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
            }

            const changes = normalizeCampaignFields(payload);
            const next = {
                ...asPlainObject(current),
                ...changes,
                audience: Object.hasOwn(changes, "audience")
                    ? changes.audience
                    : current.audience
            };
            const previousStatus = current.status;
            next.status = changes.status ?? previousStatus;

            await validateStatusChange(previousStatus, next, repo);

            const templateOrAudienceChanged =
                Object.hasOwn(changes, "channel") ||
                Object.hasOwn(changes, "templateId") ||
                Object.hasOwn(changes, "audience");

            if (next.status === "ACTIVE" && templateOrAudienceChanged) {
                await validateActiveCampaign(next, repo);
            } else if (templateOrAudienceChanged && next.templateId) {
                await validateTemplate(next, repo);
            }

            if (Object.hasOwn(changes, "status")) {
                changes.completedAt = next.status === "COMPLETED"
                    ? new Date()
                    : null;
            }

            return repo.updateCampaign({ advisorId, campaignId, changes });
        },

        async listTemplates({ advisorId, channel }) {
            requireObjectId(advisorId, "advisorId");
            if (channel && !CHANNELS.has(channel)) {
                fail("channel is not supported.");
            }

            return repo.listTemplates({ advisorId, channel });
        },

        async getTemplate({ advisorId, templateId }) {
            requireObjectId(advisorId, "advisorId");
            requireObjectId(templateId, "templateId");
            const template = await repo.findTemplate({ advisorId, templateId });

            if (!template) {
                fail("Template not found.", 404, "TEMPLATE_NOT_FOUND");
            }

            return template;
        },

        async getAudience({ advisorId, campaignId }) {
            const campaign = await this.getCampaign({ advisorId, campaignId });
            const audience = await repo.findAudience({
                advisorId,
                interests: campaign.audience.interests,
                leadStatuses: campaign.audience.leadStatuses
            });

            return {
                campaignId: campaign._id,
                count: audience.length,
                recipients: audience
            };
        }
    };
}

const campaignService = createCampaignService();
export default campaignService;