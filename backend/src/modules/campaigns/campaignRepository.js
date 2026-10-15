import Campaign from "./models/Campaign.js";
import Lead from "../leads/models/Lead.js";
import Template from "./models/Template.js";

export async function createCampaign(data) {
    const campaign = new Campaign(data);
    return campaign.save();
}

export function listCampaigns({ advisorId, status }) {
    const filter = { advisorId };

    if (status) {
        filter.status = status;
    }

    return Campaign.find(filter).sort({ updatedAt: -1 });
}

export function findCampaign({ advisorId, campaignId }) {
    return Campaign.findOne({ _id: campaignId, advisorId });
}

export async function updateCampaign({ advisorId, campaignId, changes }) {
    return Campaign.findOneAndUpdate(
        { _id: campaignId, advisorId },
        { $set: changes },
        { new: true, runValidators: true }
    );
}

export function listTemplates({ advisorId, channel }) {
    const filter = { advisorId, isActive: true };

    if (channel) {
        filter.channel = channel;
    }

    return Template.find(filter).sort({ name: 1 });
}

export function findTemplate({ advisorId, templateId }) {
    return Template.findOne({
        _id: templateId,
        advisorId,
        isActive: true
    });
}

export function findAudience({ advisorId, interests, leadStatuses }) {
    const filter = {
        advisorId,
        marketingConsent: true,
        unsubscribedAt: null
    };

    if (interests.length > 0) {
        filter.interest = { $in: interests };
    }

    if (leadStatuses.length > 0) {
        filter.status = { $in: leadStatuses };
    }

    return Lead.find(filter)
        .select("_id name email interest status")
        .sort({ name: 1 });
}