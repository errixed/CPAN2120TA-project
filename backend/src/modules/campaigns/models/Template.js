import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
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

        channel: {
            type: String,
            enum: [
                "EMAIL",
                "FACEBOOK"
            ],
            required: true
        },

        subject: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },

        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "templates"
    }
);

templateSchema.index({ advisorId: 1, channel: 1 });

export default mongoose.model(
    "Template",
    templateSchema
);