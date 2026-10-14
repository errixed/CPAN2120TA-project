import mongoose from "mongoose";

export default async function connectDatabase(uri) {
    if (!uri) {
        throw new Error("MONGO_URI is required to connect to MongoDB.");
    }

    await mongoose.connect(uri);
    return mongoose.connection;
}