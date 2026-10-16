import * as deliveryRepo from '../repositories/deliveryRepository.js';
import DeliveryJob from "../models/DeliveryJob.js";
import AppError from "../../../utils/AppError.js";
import leadRepository from "../../leads/leadRepository.js";
import campaignService from "../../campaigns/campaignService.js";
import { sendMockDelivery } from "../providers/mockProvider.js";

const ALLOWED_FIELDS = new Set([
    "advisorId",
    "campaignId",
    "leadId",
    "channel",
    "recipientEmail",
    "content",
    "scheduledAt"
]);

function validateMarketingConsent(data) {
    if (data.channel !== "EMAIL") {
        return;
    }

    if (!data.leadId) {
        throw new AppError(
            "leadId is required for email delivery.",
            400,
            "LEAD_ID_REQUIRED"
        );
    }

    const lead = leadRepository.findById(String(data.leadId));

    if (!lead) {
        throw new AppError(
            "Lead not found.",
            404,
            "LEAD_NOT_FOUND"
        );
    }

    if (
        lead.marketingConsent !== true ||
        lead.unsubscribedAt != null
    ) {
        throw new AppError(
            "The lead has not consented to marketing or has unsubscribed.",
            403,
            "MARKETING_CONSENT_REQUIRED"
        );
    }

    if (
        data.recipientEmail &&
        data.recipientEmail.trim().toLowerCase() !==
        lead.email.trim().toLowerCase()
    ) {
        throw new AppError(
            "recipientEmail does not match the selected lead.",
            400,
            "RECIPIENT_MISMATCH"
        );
    }

    data.recipientEmail = lead.email;
}

async function validateDeliveryCampaign(data, advisorId) {
    if (!advisorId) {
        throw new AppError(
            "advisorId is required.",
            400,
            "ADVISOR_ID_REQUIRED"
        );
    }

    const campaign = await campaignService.getCampaign({
        advisorId,
        campaignId: String(data.campaignId)
    });

    if (campaign.status !== "ACTIVE") {
        throw new AppError(
            "Only ACTIVE campaigns can queue deliveries.",
            400,
            "CAMPAIGN_NOT_ACTIVE"
        );
    }

    if (campaign.channel !== data.channel) {
        throw new AppError(
            "Delivery channel must match the campaign channel.",
            400,
            "CHANNEL_MISMATCH"
        );
    }

    return campaign;
}

async function validateAudienceMembership(data, advisorId) {
    if (data.channel !== "EMAIL") {
        return;
    }

    const audience = await campaignService.getAudience({
        advisorId,
        campaignId: String(data.campaignId)
    });

    const isEligible = audience.recipients.some(
        recipient =>
            String(recipient._id) === String(data.leadId)
    );

    if (!isEligible) {
        throw new AppError(
            "Lead does not belong to the selected campaign audience.",
            403,
            "LEAD_NOT_IN_AUDIENCE"
        );
    }
}

function validateDelivery(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new AppError(
            "Request body must be a JSON object.",
            400,
            "INVALID_REQUEST"
        );
    }

    const unknownFields = Object.keys(data).filter(
        field => !ALLOWED_FIELDS.has(field)
    );

    if (unknownFields.length > 0) {
        throw new AppError(
            `Unsupported field(s): ${unknownFields.join(", ")}.`,
            400,
            "INVALID_REQUEST"
        );
    }

    if (
        !data.content ||
        typeof data.content !== "object" ||
        Array.isArray(data.content)
    ) {
        throw new AppError(
            "content must be an object.",
            400,
            "INVALID_REQUEST"
        );
    }

    const job = new DeliveryJob(data);
    const error = job.validateSync();

    if (error) {
        error.statusCode = 400;
        throw error;
    }

    return job.toObject({
        flattenObjectIds: true
    });
}

async function validateDeliveryEligibility(job) {
    const lead = job.leadId
        ? leadRepository.findById(String(job.leadId))
        : null;

    if (job.channel === "EMAIL") {
        if (!lead) {
            throw new AppError(
                "The recipient lead no longer exists.",
                404,
                "LEAD_NOT_FOUND"
            );
        }

        validateMarketingConsent({
            channel: job.channel,
            leadId: job.leadId,
            recipientEmail: job.recipientEmail
        });
    }

    if (job.leadId && !lead) {
        throw new AppError(
            "Lead not found.",
            404,
            "LEAD_NOT_FOUND"
        );
    }

    const advisorId = String(job.advisorId);

    if (
        lead &&
        String(lead.advisorId).toLowerCase() !== advisorId.toLowerCase()
    ) {
        throw new AppError(
            "Lead and advisor do not match.",
            400,
            "ADVISOR_MISMATCH"
        );
    }

    await validateDeliveryCampaign(job, advisorId);

    if (job.channel === "EMAIL") {
        const audience = await campaignService.getAudience({
            advisorId,
            campaignId: String(job.campaignId)
        });

        const isEligible = audience.recipients.some(
            recipient =>
                String(recipient._id) === String(job.leadId)
        );

        if (!isEligible) {
            throw new AppError(
                "Lead is no longer eligible for this campaign.",
                403,
                "LEAD_NOT_IN_AUDIENCE"
            );
        }
    }
}

export const processDelivery = async (jobId) => {
    const jobs = await deliveryRepo.getDeliveryJobs();

    const job = jobs.find(
        job => String(job._id) === String(jobId)
    );

    if (!job) {
        throw new AppError(
            "Delivery job not found.",
            404,
            "DELIVERY_NOT_FOUND"
        );
    }

    if (job.deliveryStatus !== "PENDING") {
        throw new AppError(
            "Only PENDING delivery jobs can be processed.",
            409,
            "INVALID_DELIVERY_STATUS"
        );
    }

    if (job.scheduledAt && new Date(job.scheduledAt) > new Date()) {
        throw new AppError(
            "Delivery job is scheduled for a future date.",
            409,
            "DELIVERY_NOT_DUE"
        );
    }

    await validateDeliveryEligibility(job);

    const claimedJob = await deliveryRepo.claimDeliveryJob(jobId);

    if (!claimedJob) {
        throw new AppError(
            "Delivery job is already being processed or is no longer pending.",
            409,
            "DELIVERY_ALREADY_CLAIMED"
        );
    }

    try {
        const result = await sendMockDelivery(claimedJob);

        return await deliveryRepo.updateDeliveryJob(jobId, {
            deliveryStatus: result.success ? "SENT" : "FAILED",
            sentAt: result.success ? new Date() : null,
            providerMessageId: result.providerMessageId ?? null,
            errorMessage: result.errorMessage ?? null
        });

    } catch (error) {
        const failedJob = await deliveryRepo.updateDeliveryJob(jobId, {
            deliveryStatus: "FAILED",
            sentAt: null,
            providerMessageId: null,
            errorMessage: "Mock delivery processing failed."
        });

        if (!failedJob) {
            throw new AppError(
                "Delivery job could not be updated.",
                500,
                "DELIVERY_UPDATE_FAILED"
            );
        }

        return failedJob;
    }
};

export const queueDelivery = async (deliveryData) => {
    const lead = deliveryData?.leadId
        ? leadRepository.findById(String(deliveryData.leadId))
        : null;

    if (deliveryData?.leadId && !lead) {
        throw new AppError(
            "Lead not found.",
            404,
            "LEAD_NOT_FOUND"
        );
    }

    if (
        lead &&
        deliveryData.advisorId &&
        String(deliveryData.advisorId).toLowerCase() !==
            String(lead.advisorId).toLowerCase()
    ) {
        throw new AppError(
            "Lead and advisor do not match.",
            400,
            "ADVISOR_MISMATCH"
        );
    }

    const advisorId = lead
        ? String(lead.advisorId)
        : deliveryData?.advisorId;

    const validatedData = validateDelivery({
        ...deliveryData,
        advisorId
    });

    validateMarketingConsent(validatedData);

    await validateDeliveryCampaign(validatedData, advisorId);

    await validateAudienceMembership(validatedData, advisorId);

    const job = await deliveryRepo.createDeliveryJob(validatedData);

    return job;
};

export const getDeliveryHistory = async (filters = {}) => {
    return await deliveryRepo.getDeliveryJobs(filters);
};