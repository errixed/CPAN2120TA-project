import { Types } from "mongoose";

export const sendMockDelivery = async (job) => {
    const supportedChannels = ["EMAIL", "FACEBOOK"];

    if (!supportedChannels.includes(job.channel)) {
        return {
            success: false,
            simulated: true,
            providerMessageId: null,
            errorMessage: "Unsupported delivery channel."
        };
    }

    return {
        success: true,
        simulated: true,
        providerMessageId: `mock-${job.channel.toLowerCase()}-${new Types.ObjectId()}`,
        errorMessage: null
    };
};