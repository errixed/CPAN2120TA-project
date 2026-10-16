import { Types } from "mongoose";
import AppError from "../../../utils/AppError.js";

// temporary bucket to hold onto data while still in phase 1.
let mockDeliveryJobs = [];

const UPDATABLE_FIELDS = new Set([
    "deliveryStatus",
    "attempts",
    "sentAt",
    "providerMessageId",
    "errorMessage"
]);

const STATUS_TRANSITIONS = Object.freeze({
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SENT", "FAILED"],
    SENT: [],
    FAILED: [],
    CANCELLED: []
});

export const createDeliveryJob = async (jobData) => {
    const newJob = {
        // unique id generator using milliseconds as a temporary solution.
        ...jobData,
        _id: new Types.ObjectId().toString(),
        simulated: true,
        deliveryStatus: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const isDuplicate = mockDeliveryJobs.some(job =>
        ["PENDING", "PROCESSING"].includes(job.deliveryStatus) &&
        String(job.campaignId) === String(newJob.campaignId) &&
        String(job.leadId ?? "") === String(newJob.leadId ?? "") &&
        job.channel === newJob.channel &&
        JSON.stringify(job.content) === JSON.stringify(newJob.content) &&
        String(job.scheduledAt ?? "") === String(newJob.scheduledAt ?? "")
    );

    if (isDuplicate) {
        throw new AppError(
            "An identical delivery job is already queued.",
            409,
            "DUPLICATE_DELIVERY"
        );
    }
    
    mockDeliveryJobs.push(newJob);
    return newJob;
};

export const getDeliveryJobs = async (filters = {}) => {
    let results = mockDeliveryJobs;
    
    // allow GET to search for specific jobs, ensuring correct processing of queries when testing Postman independently
    if (filters.campaignId) {
        results = results.filter(job => String(job.campaignId) === String(filters.campaignId));
    }
    if (filters.deliveryStatus) {
        results = results.filter(job => job.deliveryStatus === filters.deliveryStatus);
    }
    
    return results;
};

export const updateDeliveryJob = async (id, updateData) => {
    const jobIndex = mockDeliveryJobs.findIndex(
        job => String(job._id) === String(id)
    );

    if (jobIndex === -1) return null;

    const changes = Object.fromEntries(
        Object.entries(updateData).filter(
            ([key]) => UPDATABLE_FIELDS.has(key)
        )
    );

    const currentStatus = mockDeliveryJobs[jobIndex].deliveryStatus;
    const nextStatus = changes.deliveryStatus;

    if (
        nextStatus !== undefined &&
        !STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)
    ) {
        throw new AppError(
            `Invalid delivery status transition: ${currentStatus} to ${nextStatus}.`,
            409,
            "INVALID_STATUS_TRANSITION"
        );
    }

    mockDeliveryJobs[jobIndex] = {
        ...mockDeliveryJobs[jobIndex],
        ...changes,
        updatedAt: new Date()
    };

    return mockDeliveryJobs[jobIndex];
};

export const claimDeliveryJob = async (id) => {
    const job = mockDeliveryJobs.find(
        job => String(job._id) === String(id)
    );

    if (!job || job.deliveryStatus !== "PENDING") {
        return null;
    }

    job.deliveryStatus = "PROCESSING";
    job.attempts += 1;
    job.updatedAt = new Date();

    return { ...job };
};