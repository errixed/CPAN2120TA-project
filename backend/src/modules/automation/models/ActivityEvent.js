import mongoose from "mongoose";

const activityEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            trim: true
        },

        eventType: {
            type: String,
            enum: [
                "LEAD_CREATED",
                "LEAD_STATUS_CHANGED",
                "CONSULTATION_REQUESTED",
                "CAMPAIGN_ACTIVATED",
                "DELIVERY_SENT",
                "DELIVERY_FAILED",
                "AUTOMATION_EXECUTED",
                "AUTOMATION_FAILED"
            ],
            required: true
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        entityType: {
            type: String,
            enum: [
                "LEAD",
                "CAMPAIGN",
                "DELIVERY_JOB",
                "AUTOMATION_RULE"
            ],
            required: true
        },

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        occurredAt: {
            type: Date,
            default: Date.now
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        collection: "activityEvents"
    }
);

activityEventSchema.index(
    { eventId: 1 },
    { unique: true }
);

activityEventSchema.index({
    eventType: 1,
    occurredAt: -1
});

activityEventSchema.index({
    ownerId: 1,
    occurredAt: -1
});

export default mongoose.model(
    "ActivityEvent",
    activityEventSchema
);