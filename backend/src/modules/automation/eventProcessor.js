// Decides which automation rules react to an event.
//
// Phase I: pure matching, no side effects. Actions are described as
// SIMULATED and are never executed (no email is sent).
// Phase II: this is where triggers will be processed, duplicates avoided
// and follow-ups scheduled.

export const ruleMatchesEvent = (rule, event) => {
    if (!rule.enabled) return false;
    if (rule.trigger !== event.eventType) return false;
    if (rule.ownerId !== event.ownerId) return false;

    // A rule tied to one campaign only reacts to events from that campaign.
    if (rule.campaignId && rule.campaignId !== event.metadata?.campaignId) {
        return false;
    }

    return true;
};

export const buildSimulatedActions = (rules, event, now = new Date()) =>
    rules
        .filter((rule) => ruleMatchesEvent(rule, event))
        .map((rule) => ({
            ruleId: rule._id,
            ruleName: rule.name,
            action: rule.action,
            delayMinutes: rule.delayMinutes,
            scheduledFor: new Date(
                now.getTime() + rule.delayMinutes * 60 * 1000
            ).toISOString(),
            status: "SIMULATED"
        }));
