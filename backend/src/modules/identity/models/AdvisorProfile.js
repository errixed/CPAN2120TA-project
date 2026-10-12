import mongoose from "mongoose";

const advisorProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        specialties: {
            type: [{
                type: String,
                trim: true
            }],
            default: []
        },

        consultationTypes: {
            type: [{
                type: String,
                enum: [
                    "ONLINE",
                    "IN_PERSON",
                    "PHONE"
                ]
            }],
            default: []
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        isPublic: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: "advisorProfiles"
    }
);

advisorProfileSchema.index(
    { userId: 1 },
    { unique: true }
);

export default mongoose.model(
    "AdvisorProfile",
    advisorProfileSchema
);