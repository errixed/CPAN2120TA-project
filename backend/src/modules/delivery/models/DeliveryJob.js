import mongoose from "mongoose";

const deliveryJobSchema = new mongoose.Schema(
    {
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorProfile",
            required: true
        },

        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true
        },

        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            default: null
        },

        channel: {
            type: String,
            enum: [
                "EMAIL",
                "FACEBOOK"
            ],
            required: true
        },

        recipientEmail: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 254,
            default: null
        },

        content: {
            subject: {
                type: String,
                trim: true,
                maxlength: 200,
                default: ""
            },

            body: {
                type: String,
                required: true,
                maxlength: 10000
            }
        },

        deliveryStatus: {
            type: String,
            enum: [
                "PENDING",
                "PROCESSING",
                "SENT",
                "FAILED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        scheduledAt: {
            type: Date,
            default: null
        },

        sentAt: {
            type: Date,
            default: null
        },

        providerMessageId: {
            type: String,
            default: null
        },

        attempts: {
            type: Number,
            min: 0,
            default: 0
        },

        errorMessage: {
            type: String,
            maxlength: 1000,
            default: null
        },
        simulated: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true,
        collection: "deliveryJobs"
    }
);

deliveryJobSchema.index({
    campaignId: 1,
    deliveryStatus: 1
});

deliveryJobSchema.index({
    deliveryStatus: 1,
    scheduledAt: 1
});

export default mongoose.model(
    "DeliveryJob",
    deliveryJobSchema
);