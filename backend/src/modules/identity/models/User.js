import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
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

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: [
                "ADMIN",
                "ADVISOR",
                "MARKETING_SPECIALIST"
            ],
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "users"
    }
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);