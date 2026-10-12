import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
    {
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdvisorProfile",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: ""
        },

        interest: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        status: {
            type: String,
            enum: [
                "NEW",
                "CONTACTED",
                "CONSULTATION_REQUESTED",
                "CONVERTED"
            ],
            default: "NEW"
        },

        marketingConsent: {
            type: Boolean,
            default: false
        },

        consentRecordedAt: {
            type: Date,
            default: null
        },

        unsubscribedAt: {
            type: Date,
            default: null
        },

        source: {
            type: String,
            enum: [
                "WEBSITE",
                "FACEBOOK",
                "MANUAL",
                "OTHER"
            ],
            default: "MANUAL"
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        }
    },
    {
        timestamps: true,
        collection: "leads"
    }
);

leadSchema.index({ advisorId: 1, status: 1 });
leadSchema.index({ advisorId: 1, email: 1 });

export default mongoose.model("Lead", leadSchema);