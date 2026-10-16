import mongoose from "mongoose";

// Phase I: temporary in-memory storage.
// Phase II: replace the function bodies with Mongoose queries on
// AutomationRule / ActivityEvent and keep the same signatures.

const newId = () => new mongoose.Types.ObjectId().toString();

// Sample ids so the module can be tested without other modules.
export const SAMPLE_OWNER_ID = "665f1c2a9b1e8a0012a4c001";
export const SAMPLE_LEAD_ID = "665f1c2a9b1e8a0012a4c101";

const rules = [];
const events = [];

const seed = () => {
    const now = new Date().toISOString();

    rules.push(
        {
            _id: newId(),
            ownerId: SAMPLE_OWNER_ID,
            name: "Welcome new leads",
            description: "Send a welcome email when a lead is created.",
            trigger: "LEAD_CREATED",
            action: "SEND_EMAIL",
            campaignId: null,
            delayMinutes: 0,
            enabled: true,
            lastExecutedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: newId(),
            ownerId: SAMPLE_OWNER_ID,
            name: "Follow up on consultation requests",
            description: "Schedule a follow-up after a consultation request.",
            trigger: "CONSULTATION_REQUESTED",
            action: "SCHEDULE_FOLLOW_UP",
            campaignId: null,
            delayMinutes: 1440,
            enabled: true,
            lastExecutedAt: null,
            createdAt: now,
            updatedAt: now
        }
    );
};

seed();

const matches = (record, filter) =>
    Object.entries(filter).every(([key, value]) => record[key] === value);

export const createRule = async (data) => {
    const now = new Date().toISOString();
    const rule = {
        _id: newId(),
        ...data,
        lastExecutedAt: null,
        createdAt: now,
        updatedAt: now
    };
    rules.push(rule);
    return rule;
};

export const findRules = async (filter = {}) =>
    rules.filter((rule) => matches(rule, filter));

export const createEvent = async (data) => {
    const now = new Date().toISOString();
    const event = {
        _id: newId(),
        ...data,
        occurredAt: data.occurredAt ?? now,
        createdAt: now,
        updatedAt: now
    };
    events.push(event);
    return event;
};

export const findEvents = async (filter = {}) =>
    events.filter((event) => matches(event, filter));

export const findEventByEventId = async (eventId) =>
    events.find((event) => event.eventId === eventId) ?? null;

// Used by tests to start from a clean, seeded state.
export const resetForTests = () => {
    rules.length = 0;
    events.length = 0;
    seed();
};
