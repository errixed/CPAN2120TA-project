import mongoose from "mongoose";

const automationRuleSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        trigger: {
            type: String,
            enum: [
                "LEAD_CREATED",
                "LEAD_STATUS_CHANGED",
                "CONSULTATION_REQUESTED",
                "CAMPAIGN_ACTIVATED"
            ],
            required: true
        },

        action: {
            type: String,
            enum: [
                "SEND_EMAIL",
                "SCHEDULE_FOLLOW_UP",
                "CREATE_NOTIFICATION"
            ],
            required: true
        },

        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            default: null
        },

        delayMinutes: {
            type: Number,
            min: 0,
            max: 43200,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: "Delay must be a whole number."
            }
        },

        enabled: {
            type: Boolean,
            default: false
        },

        lastExecutedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        collection: "automationRules"
    }
);

automationRuleSchema.index({
    ownerId: 1,
    enabled: 1
});

automationRuleSchema.index({
    trigger: 1,
    enabled: 1
});

export default mongoose.model(
    "AutomationRule",
    automationRuleSchema
);