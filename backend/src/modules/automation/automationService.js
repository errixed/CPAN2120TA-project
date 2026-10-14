import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import AutomationRule from "./models/AutomationRule.js";
import ActivityEvent from "./models/ActivityEvent.js";
import * as repository from "./automationRepository.js";
import { buildSimulatedActions } from "./eventProcessor.js";

// Allowed values come from the Mongoose schemas so they never drift apart.
const TRIGGERS = AutomationRule.schema.path("trigger").enumValues;
const ACTIONS = AutomationRule.schema.path("action").enumValues;
const EVENT_TYPES = ActivityEvent.schema.path("eventType").enumValues;
const ENTITY_TYPES = ActivityEvent.schema.path("entityType").enumValues;

// errorHandler.js reads err.statusCode and err.message.
const httpError = (statusCode, problems) => {
    const list = Array.isArray(problems) ? problems : [problems];
    const error = new Error(list.join(" "));
    error.statusCode = statusCode;
    return error;
};

const isId = (value) =>
    typeof value === "string" && mongoose.isValidObjectId(value) && value.length === 24;

const oneOf = (list) => `must be one of: ${list.join(", ")}.`;

export const createRule = async (body = {}) => {
    const problems = [];

    if (!isId(body.ownerId)) problems.push("ownerId must be a valid id.");

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 3 || name.length > 150) {
        problems.push("name must be 3 to 150 characters.");
    }

    if (body.description !== undefined) {
        if (typeof body.description !== "string" || body.description.length > 1000) {
            problems.push("description must be text up to 1000 characters.");
        }
    }

    if (!TRIGGERS.includes(body.trigger)) problems.push(`trigger ${oneOf(TRIGGERS)}`);
    if (!ACTIONS.includes(body.action)) problems.push(`action ${oneOf(ACTIONS)}`);

    if (body.campaignId !== undefined && body.campaignId !== null && !isId(body.campaignId)) {
        problems.push("campaignId must be a valid id or null.");
    }

    if (body.delayMinutes !== undefined) {
        if (
            !Number.isInteger(body.delayMinutes) ||
            body.delayMinutes < 0 ||
            body.delayMinutes > 43200
        ) {
            problems.push("delayMinutes must be a whole number from 0 to 43200.");
        }
    }

    if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
        problems.push("enabled must be true or false.");
    }

    if (problems.length) throw httpError(400, problems);

    return repository.createRule({
        ownerId: body.ownerId,
        name,
        description: body.description?.trim() ?? "",
        trigger: body.trigger,
        action: body.action,
        campaignId: body.campaignId ?? null,
        delayMinutes: body.delayMinutes ?? 0,
        enabled: body.enabled ?? false
    });
};

export const listRules = async (query = {}) => {
    const filter = {};
    const problems = [];

    if (query.ownerId !== undefined) {
        if (isId(query.ownerId)) filter.ownerId = query.ownerId;
        else problems.push("ownerId must be a valid id.");
    }
    if (query.trigger !== undefined) {
        if (TRIGGERS.includes(query.trigger)) filter.trigger = query.trigger;
        else problems.push(`trigger ${oneOf(TRIGGERS)}`);
    }
    if (query.action !== undefined) {
        if (ACTIONS.includes(query.action)) filter.action = query.action;
        else problems.push(`action ${oneOf(ACTIONS)}`);
    }
    if (query.enabled !== undefined) {
        if (["true", "false"].includes(query.enabled)) {
            filter.enabled = query.enabled === "true";
        } else {
            problems.push("enabled must be true or false.");
        }
    }

    if (problems.length) throw httpError(400, problems);

    return repository.findRules(filter);
};

// Simulates an event. Other modules will later emit the same shape:
//   { eventType, entityType, entityId, ownerId, metadata }
// All body fields are optional; defaults give a sample LEAD_CREATED event.
export const simulateEvent = async (body = {}) => {
    const eventType = body.eventType ?? "LEAD_CREATED";
    const entityType = body.entityType ?? "LEAD";
    const entityId = body.entityId ?? repository.SAMPLE_LEAD_ID;
    const ownerId = body.ownerId ?? repository.SAMPLE_OWNER_ID;
    const eventId = body.eventId ?? `evt_${randomUUID()}`;
    const metadata = body.metadata ?? {};

    const problems = [];
    if (!EVENT_TYPES.includes(eventType)) problems.push(`eventType ${oneOf(EVENT_TYPES)}`);
    if (!ENTITY_TYPES.includes(entityType)) problems.push(`entityType ${oneOf(ENTITY_TYPES)}`);
    if (!isId(entityId)) problems.push("entityId must be a valid id.");
    if (!isId(ownerId)) problems.push("ownerId must be a valid id.");
    if (typeof eventId !== "string" || !eventId.trim()) {
        problems.push("eventId must be a non-empty string.");
    }
    if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
        problems.push("metadata must be an object.");
    }
    if (problems.length) throw httpError(400, problems);

    // Mirrors the unique index on ActivityEvent.eventId: no duplicate processing.
    if (await repository.findEventByEventId(eventId)) {
        throw httpError(409, `Event ${eventId} was already processed.`);
    }

    const rules = await repository.findRules();
    const draft = { eventType, ownerId, metadata };
    const simulatedActions = buildSimulatedActions(rules, draft);

    const event = await repository.createEvent({
        eventId,
        eventType,
        entityId,
        entityType,
        ownerId,
        metadata: { ...metadata, simulatedActions }
    });

    return { event, simulatedActions };
};

export const listEvents = async (query = {}) => {
    const filter = {};
    const problems = [];

    if (query.eventType !== undefined) {
        if (EVENT_TYPES.includes(query.eventType)) filter.eventType = query.eventType;
        else problems.push(`eventType ${oneOf(EVENT_TYPES)}`);
    }
    if (query.ownerId !== undefined) {
        if (isId(query.ownerId)) filter.ownerId = query.ownerId;
        else problems.push("ownerId must be a valid id.");
    }
    if (query.entityId !== undefined) {
        if (isId(query.entityId)) filter.entityId = query.entityId;
        else problems.push("entityId must be a valid id.");
    }

    if (problems.length) throw httpError(400, problems);

    return repository.findEvents(filter);
};

const countBy = (items, getKey) =>
    items.reduce((counts, item) => {
        const key = getKey(item);
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
    }, {});

export const getAnalyticsSummary = async () => {
    const [rules, events] = await Promise.all([
        repository.findRules(),
        repository.findEvents()
    ]);

    const simulatedActions = events.flatMap(
        (event) => event.metadata?.simulatedActions ?? []
    );

    return {
        rules: {
            total: rules.length,
            enabled: rules.filter((rule) => rule.enabled).length,
            disabled: rules.filter((rule) => !rule.enabled).length,
            byTrigger: countBy(rules, (rule) => rule.trigger),
            byAction: countBy(rules, (rule) => rule.action)
        },
        events: {
            total: events.length,
            byType: countBy(events, (event) => event.eventType),
            withMatchingRules: events.filter(
                (event) => (event.metadata?.simulatedActions ?? []).length > 0
            ).length
        },
        simulatedActions: {
            total: simulatedActions.length,
            byAction: countBy(simulatedActions, (item) => item.action)
        },
        generatedAt: new Date().toISOString()
    };
};
